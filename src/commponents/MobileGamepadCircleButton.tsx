import { Box } from '@chakra-ui/react';
import { useWebRTC } from '../lib/webrtc';

export function MobileGamepadCircleButton(
  { keyCode }: { keyCode: number }
) {
  const { dataChannel } = useWebRTC();

  const sendBytesToDataChannel = (buf: ArrayBuffer) => {
    if (buf.byteLength === 0) return;
    if (dataChannel == null || dataChannel.readyState !== "open") {
      console.log(dataChannel);
      console.log(buf);
      return;
    }
    dataChannel.send(buf);
  }

  return (
    <Box
      w="30px"
      h="30px"
      borderRadius="50%"
      bg='rgba(0, 0, 0, 0.5)'
      zIndex="100"
      _active={{
        bg: 'rgba(255, 255, 255, 0.25)'
      }}
      onTouchStart={() => {
        sendBytesToDataChannel(new Uint8Array([ 0x10 | (0x0f & keyCode) ]))
      }}
      onTouchEnd={() => {
        sendBytesToDataChannel(new Uint8Array([ 0x20 | (0x0f & keyCode) ]))
      }}
    >
    </Box>
  )
}