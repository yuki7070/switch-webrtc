import { useEffect, useRef, useState } from 'react';
import {
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  VStack,
  HStack,
  Center,
  Button,
} from '@chakra-ui/react'
import { useWebRTC } from '../lib/webrtc';

const useAnimationFrame = (isRunning: boolean, callback = () => {}) => {
  const reqIdRef = useRef<number>(null!);
  const loop = () => {
    if (isRunning) {
      reqIdRef.current = requestAnimationFrame(loop);
      callback();
    }
  }

  useEffect(() => {
    reqIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqIdRef.current);
  }, [loop]);
};


export function GamepadModal(props: {
  setShowGanpadModal: (value: boolean) => void,
  showGanpadModal: boolean
}) {
  const { dataChannel } = useWebRTC();

  const sendBytesToDataChannel = (buf: ArrayBuffer) => {
    if (buf.byteLength === 0) return;
    if (dataChannel == null || dataChannel.readyState !== "open") {
      setIsRunning(false);
      console.log(buf);
      return;
    }
    dataChannel.send(buf);
  }

  const [gamePadIndex, setGamepadIndex] = useState<number | undefined>(undefined);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const connectGamepad = (g: Gamepad) => {
    if (gamePadIndex) {
      setGamepadIndex(undefined);
      setIsRunning(false);
    }
    setGamepadIndex(g.index);
    setIsRunning(true);
    props.setShowGanpadModal(false)
  }

  useAnimationFrame(isRunning, () => {
    if (gamePadIndex === undefined) {
      return;
    }
    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamePadIndex];
    if (!gp) {
      throw new Error('there is no gamepad');
    }

    let key = 0x800000;
    for (let i = 0; i < gp.buttons.length; i++) {
      const b = gp.buttons[i];
      key = key | (Number(b.pressed) << (23 - i - 1));
    }
    key = key & 0xffffff

    const lx = gp.axes[0];
    const ly = gp.axes[1];
    const ls = (((Math.round(Math.abs(lx) * 7) & 0b0111)
        | (Number(Math.sign(lx) === 1) << 3)) << 4)
      | ((Math.round(Math.abs(ly) * 7) & 0b0111)
        | (Number(Math.sign(ly) === 1) << 3));
        
    const rx = gp.axes[2];
    const ry = gp.axes[3];
    const rs = (((Math.round(Math.abs(rx) * 7) & 0b0111)
      | (Number(Math.sign(rx) === 1) << 3)) << 4)
      | ((Math.round(Math.abs(ry) * 7) & 0b0111)
        | (Number(Math.sign(ry) === 1) << 3))

    sendBytesToDataChannel(
      new Uint8Array([key >> 16, key >> 8, key & 0xff, ls, rs])
    )
  })

  return (
    <Modal
      isOpen={props.showGanpadModal}
      onClose={() => props.setShowGanpadModal(false)}
      isCentered={true}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent w="100%" p="30px">
        <VStack>
          {[...window.navigator.getGamepads()].map((d, i) => {
            if (!d) return null;
            return (
              <HStack
                key={i}
                w="100%"
              >
                <Center w="80%">
                  {d?.id}
                </Center>
                {d.index === gamePadIndex ? (
                  <Button
                    w="20%"
                    onClick={() => {
                      setGamepadIndex(undefined);
                      setIsRunning(false);
                    }}
                    disabled={dataChannel?.readyState !== 'open'}
                  >
                    切断
                  </Button>
                ) : (
                  <Button
                    w="20%"
                    onClick={() => connectGamepad(d)}
                    disabled={dataChannel?.readyState !== 'open'}
                  >
                    接続
                  </Button>
                )}
                
              </HStack>
            )}
          )}
          {[...window.navigator.getGamepads()]
            .filter(d => d !== null).length === 0 && (
              <Text>
                コントローラーが接続されていません。
              </Text>
          )}
        </VStack>
      </ModalContent>
    </Modal>
  );
}