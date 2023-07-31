# Ombi-Mobile
Unofficial mobile PWA for [Ombi](https://github.com/tidusjar/Ombi)

**Note** This is only a frontend for the Ombi app. We are **not** able to access your data in any way.

by @marvinvr

## Installation

### iOS
1. Open the URL [https://ombi-mobile.marvinvr.dev](https://ombi-mobile.marvinvr.dev) in **Safari on iOS**
2. Tap the `share` icon on the bottom UI in Safari
3. Click `Add to Home Screen`

### Android
1. Open the URL [https://ombi-mobile.marvinvr.dev](https://ombi-mobile.marvinvr.dev) in **Chrome on Android**
2. Tap `Add to home screen`
3. Follow the onscreen instructions to install


## App Setup
Enter the following credentials on the configuration page in the app
- `URL` - The URL to your ombi instance (format: `https://my.ombi-url.io` *without trailing slash*)
- `Username` - Your Ombi user email
- `Password` - Your Ombi user password

## DEV environment

#### Install Ionic (globally)
`npm install -g @ionic/cli`

#### Clone the repository
`git clone https://github.com/marvinvr/ombi-mobile`

#### Install dependencies
`npm install`

#### Start the project
`ionic serve`

## Self Hosting

### Docker
Pull the official Docker image here [https://hub.docker.com/r/marvinvr/ombi-mobile](https://hub.docker.com/r/marvinvr/ombi-mobile)
- HTTP Port `3000`

### Setting a predefined host for your users
A predefined host can be set in one of two ways:

#### Docker environment variable
If you are using the Docker image, you can set the environment variable `PREDEFINED_HOST` to your Ombi URL (including (https | http)://). This will automatically set the host for your users.

#### Running the app from source
If you are running the app from source, you can set the host by creating the file 'src/assets/settings/predefined-host.txt' and adding your Ombi URL (including (https | http)://) to it. There is an example file in the same directory.
