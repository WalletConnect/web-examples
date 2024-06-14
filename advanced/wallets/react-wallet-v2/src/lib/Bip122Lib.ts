import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto'
import { KeyringPair } from '@polkadot/keyring/types'
import { u8aToHex } from '@polkadot/util'
import { SignerPayloadJSON } from '@polkadot/types/types'
import ECPairFactory from 'ecpair'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import * as bip39 from 'bip39'
import BIP32Factory, { BIP32Interface } from 'bip32'
import bitcoinMessage from 'bitcoinjs-message'

const ECPair = ECPairFactory(ecc)
const bip32 = BIP32Factory(ecc)
interface IInitArguments {
  privateKey?: string
}

const validator = (pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean => {
  console.log('validating...', ECPair.fromPublicKey(pubkey).verify(msghash, signature))
  return ECPair.fromPublicKey(pubkey).verify(msghash, signature)
}

/**
 * Library
 */
export default class Bip122Lib {
  private account: BIP32Interface
  private mnemonic: string
  private wif: string
  private address: string

  constructor(key?: string) {
    const mnemonic = key ? key : bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const node = bip32.fromSeed(seed)
    const strng = node.toBase58()
    const restored = bip32.fromBase58(strng)

    this.address = bitcoin.payments.p2wpkh({
      pubkey: restored.publicKey,
      network: bitcoin.networks.testnet
    }).address!
    this.account = restored
    this.mnemonic = mnemonic
    this.wif = restored.toWIF()
  }

  static async init({ privateKey }: IInitArguments) {
    return new Bip122Lib(privateKey)
  }

  public getAddress() {
    return this.address
  }

  public getPrivateKey() {
    return this.mnemonic
  }

  public signMessage(message: string) {
    var keyPair = ECPair.fromWIF(this.wif)
    var privateKey = keyPair.privateKey!
    var signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed, {
      segwitType: 'p2wpkh'
    })
    return {
      signature: signature.toString('base64'),
      segwitType: 'p2wpkh'
    }
  }

  public async signTransaction(params: {
    address: string
    amount: number
    transactionType: string
  }) {
    const { address, amount, transactionType } = params
    if (this.address !== address) {
      throw new Error(`Unkown address: ${address}`)
    }

    if (amount < 0) {
      throw new Error(`Invalid amount: ${amount}`)
    }

    if (transactionType !== 'p2wpkh') {
      throw new Error(`Only p2wpkh transactions are supported. Received: ${transactionType}`)
    }

    const payment = bitcoin.payments.p2wpkh({
      pubkey: this.account.publicKey,
      network: bitcoin.networks.testnet
    })

    const utxos = await this.getUtXOs(this.address)
    if (!utxos || utxos.length === 0) {
      throw new Error(`No UTXOs found for address: ${this.address}`)
    }
    const availableBalance = this.getAvailableBalance(utxos)

    if (availableBalance < amount) {
      throw new Error(`Insufficient funds: ${availableBalance}`)
    }

    const amountToTransfer = Math.ceil((amount / 100) * 98) // 2% validators fee

    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet })

    const scriptHash = Buffer.from(payment.output?.toString('hex')!, 'hex')
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: scriptHash,
          value: utxo.value
        }
      })
    }
    psbt.addOutput({
      address: this.getAddress(),
      value: amountToTransfer
    })
    psbt.signAllInputs(ECPair.fromWIF(this.wif))

    psbt.validateSignaturesOfInput(0, validator)
    psbt.finalizeAllInputs()

    const transaction = psbt.extractTransaction()
    return transaction.toHex()
  }

  async getUtXOs(address: string): Promise<any[]> {
    // make chain dynamic
    return await (await fetch(`https://mempool.space/signet/api/address/${address}/utxo`)).json()
  }

  getAvailableBalance(utxos: any[]) {
    return utxos.reduce((acc, { value }) => acc + value, 0)
  }
}
