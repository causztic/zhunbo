// Referenced from https://github.com/Cryptkeeper/mc-ping-updated/blob/0717decfcd2994fbb5f69b718c7042fd296e85e7/MCProtocolBuffer.js

export default class ProtocolBuffer {
  constructor (buffer = Buffer.alloc(0)) {
    this.buffer = buffer;
  }


  static wrap(packet) {
    return Buffer.concat([new ProtocolBuffer().writeVarInt(packet.buffer.length).buffer, packet.buffer]);
  }

  writeUByte(value) {
    this.buffer = Buffer.concat([this.buffer, Buffer.from([value])]);
    return this;
  }

  writeUShort(value) {
    return this.writeUByte(value >> 8).writeUByte(value & 0xFF);
  }

  // https://wiki.vg/Protocol#VarInt_and_VarLong
  writeVarInt(value, length = 0) {
    if (length > 5) {
      throw new Error(`Invalid Length of ${length}`);
    }
    // Check if value is only 7 bits long
    if ((value & 0xFFFFFF80) === 0) {
      // Just write it as is
      return this.writeUByte(value);
    }
    // Set the first bit to signal that the value continues in the next byte
    // And write the 7 leftmost bits
    // Then continue with the remaining bits
    return this.writeUByte((value & 0x7F) | 0x80).writeVarInt(value >>> 7, length + 1);
  }

  readVarInt(offset = 0, length = 0) {
    if (length > 5) {
      throw new Error(`Invalid Length of ${length}`);
    }

    const byte = this.buffer.readUInt8(offset);
    if ((byte & 0x80) !== 128) {
      return byte & 0x7F;
    }

    return (this.readVarInt(offset + 1, length + 1) << 7) | byte & 0x7F;
  }

  writeString(string) {
    if (string.length > 32767) {
      throw new Error(`Invalid Length of ${string.length}`);
    }

    this.writeVarInt(Buffer.byteLength(string));
    this.buffer = Buffer.concat([this.buffer, Buffer.from(string)]);
    return this;
  }

  readString(offset = 0) {
    const length = this.readVarInt(offset);
    offset += Math.ceil(length.toString(2).length / 8);
    return this.buffer.toString('UTF-8', offset, offset + length);
  }
}