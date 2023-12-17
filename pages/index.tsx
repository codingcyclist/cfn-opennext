import Image from 'next/image'
import { Inter } from 'next/font/google'
import { NextPage } from 'next'
const inter = Inter({ subsets: ['latin'] })

interface PageProps {
  timestamp: string
}
const Home: NextPage<{ props: PageProps[] }> = ({ props }) => {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <div>
        {props.map((e, idx) => {
          return (
            <>
              <div key={idx}>{e.timestamp}</div>
            </>
          )
        })}
      </div>

    </main>
  )
}

export default Home

export async function getStaticProps() {
  const currentTs = new Date()
  const MS_PER_SECOND = 1000;
  const timestamps = [1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i  => {
    const prevTs = new Date(currentTs.valueOf() - i * MS_PER_SECOND);
    return {timestamp: prevTs.toISOString()}
  })

  return {
    props: {
      props: timestamps,
    },
    revalidate: 10, // In seconds
  }
}
