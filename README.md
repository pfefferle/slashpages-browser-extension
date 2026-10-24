# Slash Pages browser extension

A small browser extension that shows the [slash pages](https://slashpages.net/) (`/about`, `/now`, `/uses`, …) of the site you are on.

It reads them from `/.well-known/slashpages`, as described in the [`.well-known/slashpages` spec](https://github.com/pfefferle/well-known-slashpages). For WordPress there is a [plugin](https://github.com/pfefferle/wordpress-well-known-slashpages) that adds it.

## How it works

The extension only does something when you click its button. It then loads `/.well-known/slashpages` of the current site and lists the pages with their names.

It only asks for `activeTab` and `scripting`, so it has no access to the sites you visit until you click it. It does not collect any data.

The request runs in the page first, where it is a normal same-origin request. If that does not work, the popup tries it on its own. That works if the site sends `Access-Control-Allow-Origin: *`, as the spec recommends.

## Browsers

The same code works in Firefox, Chrome (and Edge, Brave, …) and Safari.

- **Firefox**: `npm start` opens Firefox with the extension.
- **Chrome**: `npm run start:chrome`, or load the folder as an unpacked extension in `chrome://extensions`.
- **Safari**: Safari needs an Xcode project around the extension. Build the zip, unpack it and run `xcrun safari-web-extension-converter <folder>`. This is not part of the CI yet.

## Development

```bash
npm install
npm test
npm run lint
npm run build
```

`npm run build` writes the zip to `dist/`. It is the same zip for the Chrome Web Store and for addons.mozilla.org.
