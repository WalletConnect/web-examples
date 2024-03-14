import Connect from '@/components/Connect'
import styles from './page.module.css'
import Custom from '@/components/Custom'
import Contracts from '@/components/Contracts'

export default function Home() {
  return (
    <main className={styles.main}>
      <Connect />
      <Custom />
      <Contracts />
    </main>
  )
}
