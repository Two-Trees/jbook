import * as esbuild from 'esbuild-wasm';
import axios from 'axios'
import localforage from 'localforage'

const fileCache = localforage.createInstance({
    name: 'filecache'
});

export const loadPlugin = (codeToConvert: string) => {
    return {
        name: 'load-plugin',
        setup(build: esbuild.PluginBuild) {
            //finds index.js exact path
            build.onLoad({ filter: /(^index\.js$)/ }, () => {
                return {
                    loader: 'jsx',
                    contents: codeToConvert,
                };
            })

            build.onLoad({ filter: /.*/ }, async (args: any) => {
                const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
                if (cachedResult) {
                    return cachedResult;
                }
            })

            build.onLoad({ filter: /.css$/ }, async (args: any) => {

                const { data, request } = await axios.get(args.path);
                const escaped = data
                    //collapse to single line
                    .replace(/\n/g, '')
                    //escape doubleqoutes
                    .replace(/"/g, '\\"')
                    //escape singlqoutes
                    .replace(/'/g, "\\'")

                // ESbuild work around, expects to load/return javascript     
                const contents = `
                  const style = document.createElement('style');
                  style.innerText = '${escaped}';
                  document.head.appendChild(style);
                `;
                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents,
                    resolveDir: new URL('./', request.responseURL).pathname
                };

                await fileCache.setItem(args.path, result);
                return result;

            })

            build.onLoad({ filter: /.*/ }, async (args: any) => {

                const { data, request } = await axios.get(args.path);
                // console.log(args.path)
                // console.log('REQ', request)
                // console.log('DATA', data)
                // console.log('onLoad', args);
                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL('./', request.responseURL).pathname
                };

                await fileCache.setItem(args.path, result);
                return result;
            });
        },
    };
};