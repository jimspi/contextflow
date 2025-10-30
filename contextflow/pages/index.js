import Head from 'next/head'
import Recall from '../contextflow'

export default function Home() {
  return (
    <>
      <Head>
        <title>Recall - Your AI Memory Assistant</title>
        <meta name="description" content="Never forget important things again. AI-powered notes and insights to help you remember what matters." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Recall />
    </>
  )
}
