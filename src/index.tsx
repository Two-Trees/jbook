import 'bulmaswatch/superhero/bulmaswatch.min.css'
import * as esbuild from 'esbuild-wasm'
import ReactDom from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin'
import { loadPlugin } from './plugins/load-plugin';
import  CodeEditor  from './components/code-editor'


const App = () => {
    const ref = useRef<any>()
    const iframe = useRef<any>()
    const [input, setInput] = useState('')
    const [code, setCode] = useState('')

    const startService = async () => {
        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm'
        })
    }

    useEffect(() => {
        startService()
    }, [])

    const onClick = async () => {
        if (!ref.current) {
            return
        }

        iframe.current.srcdoc = html; 

        // console.log(ref.current)
        const result = await ref.current.build({
            entryPoints: ['index.js'],
            bundle: true,
            write: false,
            plugins: [unpkgPathPlugin(), loadPlugin(input)],
            define: {
                'process.env.NODE_ENV': "'production'",
                global: 'window'
            }
        })
        // console.log('RESULT', result)
        // console.log('BIT ARRAY', result.outputFiles[0].contents)
        // setCode(result.outputFiles[0].text)
        iframe.current.contentWindow.postMessage(result.outputFiles[0].text, '*');
    }
    //try catch not scoped for async functions
    const html = `   
        <html>
         <head></head>
          <body>
           <div id="root"></div>
            <script>
             window.addEventListener('message', (event) => {
             console.log(event.data)
             try {
              eval(event.data);
              } catch(err) {
              console.log("www.cultureconnect.life")
              const root = document.querySelector('#root')
              root.innerHTML = '<div style="color:red;"><h4>Runtime Error</h4>' + err + '</div>'
              throw err                
             } 
           }, false);
          </script>
         </body>
        </html>
    `

    return (
        <div>
            <CodeEditor initialValue={""}
             onChange={(value) => setInput(value)} />
            <textarea value={input} onChange={(e) => setInput(e.target.value)}></textarea>
            <div>
                <button onClick={onClick}>Submit</button>
            </div>
            <pre>{code}</pre>
            <iframe ref={iframe} sandbox='allow-scripts' srcDoc={html} />
        </div>

    )
}



ReactDom.render(
    <App />, document.getElementById('root')
)
// const container = document.getElementById('root');
// const root = ReactDOM.createRoot(container);
// root.render(<App />)