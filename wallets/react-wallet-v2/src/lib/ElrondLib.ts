import {
  Transaction,
  Mnemonic,
  UserSecretKey,
  UserWallet,
  UserSigner,
  SignableMessage
} from '@elrondnetwork/erdjs'

/**
 * Types
 */
interface IInitArgs {
  mnemonic?: string
}

/**
 * Library
 */
export default class ElrondLib {
  wallet: UserWallet
  mnemonic: Mnemonic
  password: string

  constructor(mnemonic: Mnemonic) {
    this.mnemonic = mnemonic
    this.password = 'a1s2d3f4g5h6' // test purposes only

    const secretKey = mnemonic.deriveKey(0)
    const secretKeyHex = secretKey.hex()
    let fromHex = UserSecretKey.fromString(secretKeyHex)
    this.wallet = new UserWallet(fromHex, this.password)
  }

  static init({ mnemonic }: IInitArgs) {
    const mnemonicObj = mnemonic ? Mnemonic.fromString(mnemonic) : Mnemonic.generate()

    return new ElrondLib(mnemonicObj)
  }

  getMnemonic() {
    const secretKey = this.mnemonic.getWords().join(' ')

    return secretKey
  }

  getAddress() {
    const secretKey = UserWallet.decryptSecretKey(this.wallet.toJSON(), this.password)
    const address = secretKey.generatePublicKey().toAddress().bech32()

    return address
  }

  async signMessage(message: string) {
    const secretKey = UserWallet.decryptSecretKey(this.wallet.toJSON(), this.password)
    const secretKeyHex = secretKey.hex()

    const signMessage = new SignableMessage({
      message: Buffer.from(message)
    })

    const signer = new UserSigner(UserSecretKey.fromString(secretKeyHex))
    await signer.sign(signMessage)

    return { signature: signMessage.signature.hex() }
  }

  async signTransaction(transaction: any) {
    const secretKey = UserWallet.decryptSecretKey(this.wallet.toJSON(), this.password)
    const secretKeyHex = secretKey.hex()

    const signTransaction = Transaction.fromPlainObject(transaction)

    const signer = new UserSigner(UserSecretKey.fromString(secretKeyHex))
    await signer.sign(signTransaction)

    return { signature: signTransaction.getSignature().hex() }
  }
}
