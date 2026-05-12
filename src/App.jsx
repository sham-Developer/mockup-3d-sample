import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import PackagingEditor from './components/PackagingEditor'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <PackagingEditor />
    </>
  )
}

export default App
