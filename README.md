# Slash Pages browser extension

A small browser extension that shows the [slash pages](https://slashpages.net/) (`/about`, `/now`, `/uses`, …) of the site you are on.

It reads them from `/.well-known/slashpages`, as described in the [`.well-known/slashpages` spec](https://github.com/pfefferle/well-known-slashpages). For WordPress there is a [plugin](https://github.com/pfefferle/wordpress-well-known-slashpages) that adds it.

## How it works

On every site you open, the extension checks once for `/.well-known/slashpages`. If the site has one, the icon is blue and shows the number of slash pages. If not, the icon is grey. The result is kept for 10 minutes per site.

Click the icon and it lists the pages with their names. If the site has no `/.well-known/slashpages`, it tries the known paths from slashpages.net (`/about`, `/now`, …) and lists the ones that exist. This only happens when you click, because it is about 80 requests.

For the check on every site, the extension asks for access to all sites at install. You can turn that off in the browser (Firefox: the add-on → Permissions, Chrome: "Site access"). The icon then stays as it is, and the list still works when you click. The extension does not collect any data.

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
