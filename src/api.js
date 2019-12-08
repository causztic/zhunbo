import net from 'net';
import ProtocolBuffer from './ProtocolBuffer.js';

export const handshake = ({ host, port }) => {
  let data = Buffer.allocUnsafe(0);
  const client = net.createConnection({ host, port }, () => {
    client.write(ProtocolBuffer.wrap(new ProtocolBuffer()
      .writeVarInt(0) // packet ID
      .writeVarInt(-1) // minecraft server protocol
      .writeString(host) // server address
      .writeUShort(port) // server port
      .writeVarInt(1)) // server status request
    );

    client.write(ProtocolBuffer.wrap(new ProtocolBuffer().writeVarInt(0))); // send empty request
  });

  return new Promise((resolve, reject) => {
    client.setTimeout(3000, () => {
      client.destroy();
      reject(new Error(`Socket timed out when connecting to [${host}:${port}]`));
    });

    client.once('error', (error) => {
      client.destroy();
      reject(error);
    });

    client.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      const response = new ProtocolBuffer(data);
      try {
        const length = response.readVarInt();
        if (data.length > length - response.buffer.length) {
          client.destroy();
          try {
            resolve(JSON.parse(response.readString(Math.ceil(length.toString(2).length / 8) + 1)));
          } catch (error) {
            reject(error);
          }
        }
      } catch (error) {
        console.log("Waiting for more data..");
      }
    });
  });


}