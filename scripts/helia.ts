import { createHelia } from 'helia'
import { json } from '@helia/json'

// IPFS
const helia = await createHelia()

const j = json(helia)

const cid = await j.add({ key: 'value' })

const retrieveObject = await j.get(cid)

console.log('🚀 ~ retrieveObject:', retrieveObject)
