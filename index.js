import { handshake } from './src/api.js';

const args = process.argv.slice(2);
handshake({ host: args[0], port: args.length > 1 ? args[1] : 25565 }).then((result) => {
  console.log(result);
}).catch((error) => {
  console.log(error);
});
