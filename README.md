phosphor-bokeh-demo
-------------------

Build
-----

```bash
git clone --recursive https://github.com/ContinuumIO/phosphor-bokeh-demo
cd phosphor-bokeh-demo
( cd bokeh/bokehjs; npm install; npm run build )
npm install
npm run build
npm run serve
```

Then open a browser and go to http://localhost:8080
