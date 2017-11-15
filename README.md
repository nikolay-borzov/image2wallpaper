# image2wallpaper
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fnikolay-borzov%2Fimage2wallpaper.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fnikolay-borzov%2Fimage2wallpaper?ref=badge_shield)

Converts images to wallpapers using aspect ratio to determine whether an image fits

# Config params

```
--config         Path to JSON config file                                        [string]
--destPath       Destination folder                                              [string]
--exclude        Glob patterns of files/directories to exclude. '!' is prepended [array]
--width, -w      Wallaper width                                                  [number] [required]
--height, -h     Wallaper height                                                 [number] [required]
--deviation, -d  Wallaper width deviation in %. For scrollable wallpapers        [number] [default: 0]
```

# Usage

## with config file inside source directory

Create `.image2wallpaperrc.json` inside directory with images

```json
{
  "width": 720,
  "height": 1280,
  "deviation": 50,
  "destPath": "c:/wallpapers",
  "exclude": [
    "**/animated/**"
  ]
}
```

Call
```
npm run convert c:\images
```

# Package into an executable

## Windows

```
npm run build-win
```
See inside `/dist`

# Built with

- [GraphicsMagick](http://www.graphicsmagick.org/) and [gm](https://github.com/aheckmann/gm)
- [fs-jetpack](https://github.com/szwacz/fs-jetpack)
- [bluebird](https://github.com/petkaantonov/bluebird)
- [yargs](https://github.com/yargs/yargs)
- [pino](https://github.com/pinojs/pino)
- [pkg](https://github.com/zeit/pkg)
- [node-progress](https://github.com/visionmedia/node-progress)

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fnikolay-borzov%2Fimage2wallpaper.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fnikolay-borzov%2Fimage2wallpaper?ref=badge_large)