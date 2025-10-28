import Head from 'next/head'
import ContextFlow from '../contextflow'

export default function Home() {
  return (
    <>
      <Head>
        <title>ContextFlow - Personal AI Memory Layer</title>
        <meta name="description" content="A forward-looking AI product that builds continuous understanding of your work, life, and goals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ContextFlow />
    </>
  )
}
