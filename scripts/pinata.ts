import 'dotenv/config'

import { writeFile } from 'fs'
import { basename, extname } from 'path'

import pinataSDK, { PinataPinOptions, PinataPinResponse } from '@pinata/sdk'

type TPinResponse = PinataPinResponse & { isDuplicate?: boolean }

const {
  PINATA_API_KEY: pinataApiKey,
  PINATA_API_SECRET: pinataSecretApiKey
} = process.env

const GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/'
const SOURCE_DIR = 'images/'
const TARGET_FILES_WITH_DESCRIPTIONS = [
  {
    file: 'chart.png',
    description: 'Chart desc'
  },
  {
    file: 'icon.png',
    description: 'Icon desc'
  },
  {
    file: 'type.svg',
    description: 'Type SVG desc'
  },
]

const pinata = new pinataSDK({
  pinataApiKey,
  pinataSecretApiKey
})

async function pinFiles() {
  const linksToJSON: string[] = []

  await Promise.allSettled(TARGET_FILES_WITH_DESCRIPTIONS.map(async ({ file, ...rest }) => {
    try {
      const ext = extname(file)
      const name = basename(file, ext)
    
      const options: PinataPinOptions = {
        pinataMetadata: {
          name
        }
      }

      const pinFile = await pinata.pinFromFS(SOURCE_DIR + file, options) as TPinResponse

      const jsonData = {
        ...rest,
        name,
        image: `${GATEWAY_URL}${pinFile.IpfsHash}`
      }

      const pinJSON = await pinata.pinJSONToIPFS(jsonData, options) as TPinResponse

      if (!pinJSON?.isDuplicate) {
        const pinedJSONLink = `${GATEWAY_URL}${pinJSON.IpfsHash}`
        linksToJSON.push(pinedJSONLink)

        setHashes(
          `# File: :${file.toUpperCase()}\n` +
          `# image link: ${jsonData.image}\n` +
          '# JSON IpfsHash\n' +
          name.toUpperCase() + '=' + pinJSON.IpfsHash + '\n\n'
        )
      }
    } catch (error) {
      console.log('pinFiles', error);
    }
  }))

  displayLogs(linksToJSON)
}

function setHashes(content: string) {
  writeFile('.env.hashes', content, { flag: 'a+' }, (err) => {
    if (err) {
      console.error(err)
      return
    }
  })
}

function displayLogs(linksToJSON: string[]) {
  const normalizeArray = linksToJSON.length
    ? linksToJSON.join(',\n')
    : 'No links'

  console.log(
    '\n=======> Pined JSON links: <=======\n\n' +
    `${normalizeArray}` +
    '\n\n===================================\n'
  );
}

export {
  pinFiles
}
