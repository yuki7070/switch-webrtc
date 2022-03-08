import { useEffect, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useWebRTC, CODEC_TYPE } from '../lib/webrtc';
import { Layout } from '../commponents/Layout';
import { Box, HStack, VStack, Fade, IconButton } from '@chakra-ui/react';
import { MdClose, MdSettings, MdVideogameAsset, MdTouchApp } from 'react-icons/md'
import { useHistory } from 'react-router-dom';
import createJs from 'createjs-module'
import Hammer from "hammerjs";
import { throttle } from "lodash";

const buttonMapping = {
  0: 'A',
  1: 'X',
  2: 'B',
  3: 'Y',
  4: 'RSL',
  5: 'RSR',
  9: 'PLUS',
  11: 'RA',
  12: 'HOME',
  14: 'R',
  15: 'RT',
  16: 'LEFT',
  17: 'DOWN',
  18: 'UP',
  19: 'RIGHT',
  20: 'LSL',
  21: 'LSR',
  24: 'MINUS',
  26: 'LA',
  29: 'CAPTURE',
  30: 'L',
  31: 'LT'
}


export function Stream() {
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const codec = useRef<HTMLSelectElement>(null);
  const socketUrl = 'ws://192.168.3.15:8080/ws';
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, { share: true });
  const {
    peerConnection,
    makeOffer,
    setOffer,
    setAnswer,
    addIceCandidate,
    addIceCandidates,
    createdSdp,
    createdIceCandidate,
    hasReceivedSdp,
    mediaStream,
    dataChannel,
    clearPeerConnection,
    setCodec,
  } = useWebRTC();

  useEffect(() => {
    if (!lastJsonMessage) return;
    console.log('ws onmessage() data:', lastJsonMessage);
    const type = lastJsonMessage.type;
    switch (type) {
      case 'offer':
        console.log('Received offer ...');
        const offer = new RTCSessionDescription(lastJsonMessage);
        console.log('offer: ', offer);
        setOffer(offer);
        break;

      case 'answer':
        console.log('Received answer ...');
        const answer = new RTCSessionDescription(lastJsonMessage);
        console.log('answer: ', answer);
        setAnswer(answer);
        break;
      
      case 'candidate':
        console.log('Received ICE candidate ...');
        const candidate = new RTCIceCandidate(lastJsonMessage.ice);
        console.log('candidate: ', candidate);
        if (hasReceivedSdp) {
          addIceCandidate(candidate);
        } else {
          addIceCandidates(candidate);
        }
        break;
      
      case 'close':
        console.log('peer connection is closed ...');
        break;
    }
  }, [lastJsonMessage])

  useEffect(() => {
    if (!createdSdp) return;
    sendJsonMessage(createdSdp);
  }, [createdSdp])

  useEffect(() => {
    if (!createdIceCandidate) return;
    sendJsonMessage(createdIceCandidate);
  }, [createdIceCandidate])

  const connect = () => {
    console.group();
    if (!peerConnection) {
      console.log('make Offer');
      makeOffer();
    } else {
      console.warn('peer connection already exists.');
    }
    console.groupEnd();
  }

  const disconnect = () => {
    console.group();
    clearPeerConnection();

    sendJsonMessage({ type: 'close' });
    console.log('sending close message');

    if (remoteVideo.current) {
      remoteVideo.current.pause();
      remoteVideo.current.srcObject = null;
    }
    
    console.log('peerConnection is closed.');
    console.groupEnd();
  }

  const sendTextToDataChannel = (txt: string) => {
    if (txt.length === 0) return;
    if (dataChannel == null || dataChannel.readyState !== "open") {
      console.log(txt);
      return;
    }
    dataChannel.send(new TextEncoder().encode(txt));
  }

  const sendBytesToDataChannel = (buf: ArrayBuffer) => {
    if (buf.byteLength === 0) return;
    if (dataChannel == null || dataChannel.readyState !== "open") {
      console.log(dataChannel);
      console.log(buf);
      return;
    }
    dataChannel.send(buf);
  }

  useEffect(() => {
    if (!mediaStream) return;
    if (!remoteVideo.current) return;
    remoteVideo.current.srcObject = mediaStream;
  }, [mediaStream])

  const play = () => {
    if (remoteVideo.current) {
      remoteVideo.current.play();
    }
  }

  useEffect(() => {
    connect();
    return disconnect;
  }, []);


  const [isShowControl, setIsShowControl] = useState<boolean>(false)
  const [isShowGamepad, setIsShowGamepad] = useState<boolean>(true)
  const history = useHistory();

  const joystickLeft = useRef<HTMLCanvasElement>(null)
  const joystickRight = useRef<HTMLCanvasElement>(null)

  const initJoyStick = (el: HTMLCanvasElement, type: 'right' | 'left') => {
    console.log('init joystick')
    let xCenter = 50;
    let yCenter = 50;
    const stage = new createJs.Stage(el);
    
    const psp = new createJs.Shape();
    psp.graphics.beginFill('#fff').drawCircle(xCenter, yCenter, 30);
    psp.alpha = 0.5;

    stage.addChild(psp);

    createJs.Ticker.framerate = 30;
    createJs.Ticker.addEventListener('tick', stage);
    stage.update();

    const mc = new Hammer(el);

    const pos = {
      top: el.clientTop,
      left: el.clientLeft
    }
    xCenter = pos.top;
    yCenter = pos.left;
    psp.alpha = 0.5;

    stage.update();

    let canmove = false;

    // listen to events...
    mc.on("panstart", (ev) => {
      canmove = true;
      if (type === 'left') {
        sendBytesToDataChannel(new Uint8Array([0x3b]))
      } else {
        sendBytesToDataChannel(new Uint8Array([0x3c]))
      }
    })

    mc.on("panmove", throttle((ev) => {
      if (!canmove) return;
      //sendDataChannel('i')
      const coords = calculateCoords(ev.angle, ev.distance);

      psp.x = coords.x;
      psp.y = coords.y;

      psp.alpha = 0.5;
      
      stage.update();

      

      const x = Math.round(Math.min(Math.abs(coords.x), 60) / 60 * 7);
      const y = Math.round(Math.min(Math.abs(coords.y), 60) / 60 * 7);
      //console.log({ x: x, y: y })

      const val = ((((Number(Math.sign(coords.x) === 1) << 3) | Math.abs(x)) & 0b1111) << 4)
        | (((Number(Math.sign(coords.y) === 1) << 3) | Math.abs(y)) & 0b1111);

      //console.log({ x_sign: (Math.sign(coords.x) === 1), y_sign: (Math.sign(coords.y) === 1) })

      if (type === 'left') {
        sendBytesToDataChannel(new Uint8Array([0x4b, val]))
      } else {
        sendBytesToDataChannel(new Uint8Array([0x4c, val]))
      }
    }, 33));
    

    mc.on("panend", (ev) => {
      canmove = false;
      //sendDataChannel('j')
      psp.alpha = 0.25;
      createJs.Tween.get(psp).to(
        { x: xCenter, y: yCenter },
        750,
        createJs.Ease.elasticOut
      );
      if (type === 'left') {
        sendBytesToDataChannel(new Uint8Array([0x5b]))
      } else {
        sendBytesToDataChannel(new Uint8Array([0x5c]))
      }
    });
  }

  const calculateCoords = (angle: number, distance: number) => {
    var coords: any = {};
    distance = Math.min(distance, 100);
    var rads = (angle * Math.PI) / 180.0;

    coords.x = distance * Math.cos(rads);
    coords.y = distance * Math.sin(rads);

    return coords;
  }

  useEffect(() => {
    if (dataChannel == null) return;

    const init = () => {
      if (joystickLeft.current)
        initJoyStick(joystickLeft.current, 'left');

      if (joystickRight.current)
        initJoyStick(joystickRight.current, 'right');
    }

    dataChannel.addEventListener('open', init)

    return dataChannel.removeEventListener('onopen', init)
  }, [dataChannel])

  //gamepad
  const [joyConGamePad, setJoyConGamePad] = useState<number>(0)
  useEffect(() => {
    let joyConGamePadLoopID = 0;

    if (dataChannel == null || dataChannel.readyState === 'closed') {
      cancelAnimationFrame(joyConGamePadLoopID)
      return;
    }
    
    window.addEventListener('gamepadconnected', (e) => {
      console.log(e.gamepad)
      if (e.gamepad.id !== 'Joy-Con L+R (STANDARD GAMEPAD Vendor: 057e Product: 200e)') {
        return;
      }
      setJoyConGamePad(e.gamepad.index);

      const frameTime = 1/20;

      let prevTimestamp = 0;
      
      const loop = (timestamp: number) => {
        const elapsed = (timestamp - prevTimestamp) / 1000;
        if (elapsed <= frameTime) {
          joyConGamePadLoopID = requestAnimationFrame(loop);
          return;
        }

        prevTimestamp = timestamp;

        const gamepads = navigator.getGamepads();
        const gp = gamepads[joyConGamePad];
        if (!gp) return;

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

        //new Uint8Array([key & 0xf, key & 0xf0, key & 0xf00, key & 0xf000, key & 0xf0000])

        //console.log(gp.axes)
        sendBytesToDataChannel(
          new Uint8Array([key >> 16, key >> 8, key & 0xff, ls, rs])
        )
        //console.log(new Uint8Array([key & 0xff0000, key & 0xff00, key & 0xff, 0x00, 0x00]))
        /*
        let leftAxisHorizontal = gp.axes[0];
        let leftAxisVertical = gp.axes[1];
        console.log(gp.buttons);
        */
        joyConGamePadLoopID = requestAnimationFrame(loop);
      }

      joyConGamePadLoopID = requestAnimationFrame(loop);
    })

    window.addEventListener('gamepaddisconnected', () => {
      setJoyConGamePad(0);
      cancelAnimationFrame(joyConGamePadLoopID)
    })

    return () => {
      cancelAnimationFrame(joyConGamePadLoopID)
    }
  }, [dataChannel])

  

  return (
    <Layout>
      
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            aspectRatio: '16 / 9',
            backgroundColor: '#000',
            maxHeight: '100%',
            width: '100%',
            margin: '0px auto',
            position: 'relative'
          }}
        >
          <Box
            right="0"
            backgroundColor="rgba(0, 0, 0, 0)"
            position="absolute"
            onMouseOver={(e) => {
              if (!navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
                console.log('mouse')
                setIsShowControl(true)
              }
            }}
            onClick={(e) => {
              console.log('touch')
              setIsShowControl((prev) => !prev)
            }}
            zIndex="80"
          >
            <Fade in={true}>
              <HStack
                m="20px"
                w="calc(100% - 40px)"
                bg='rgba(0, 0, 0, 0.5)'
                h="50px"
                rounded='20px'
                shadow='md'
                p="10px"
                justifyContent="space-between"
                style={{
                  background: "linear-gradient(to bottom, rgba(255, 255, 255, 1)"
                }}
              >
                <HStack
                  h="100%"
                >
                  <IconButton
                    aria-label="setting"
                    size='lg'
                    variant='ghost'
                    fontSize='40px'
                    color="white"
                    icon={<MdSettings />}
                    onClick={(e) => {
                      setIsShowControl(false);
                      console.log('call setting');
                      e.stopPropagation();
                    }}
                  />
                  <IconButton
                    aria-label="gamepad"
                    size='lg'
                    variant='ghost'
                    fontSize='40px'
                    color="white"
                    icon={<MdVideogameAsset />}
                    onClick={(e) => {
                      setIsShowControl(false);
                      console.log('call setting');
                      e.stopPropagation();
                    }}
                  />
                  <IconButton
                    aria-label="touch gamepad"
                    size='lg'
                    variant='ghost'
                    fontSize='40px'
                    color="white"
                    icon={<MdTouchApp />}
                    onClick={(e) => {
                      setIsShowControl(false);
                      setIsShowGamepad(prev => !prev)
                      console.log('call setting');
                      e.stopPropagation();
                    }}
                  />
                </HStack>
                

                <IconButton
                  aria-label="close"
                  size='lg'
                  variant='ghost'
                  fontSize='40px'
                  color="white"
                  icon={<MdClose />}
                  onClick={(e) => {
                    setIsShowControl(false);
                    history.push('/');
                    e.stopPropagation();
                  }}
                />
                
              </HStack>
            </Fade>

          </Box>
          {isShowGamepad &&
            navigator.userAgent.match(/iPhone|Android.+Mobile/) && (
            <HStack
              w="100%"
              h="100%"
              position="absolute"
              justifyContent="space-between"
              userSelect="none"
            >
              <HStack h="100%">
                <Box h="100%">
                  <HStack
                    w="110px"
                    h="40px"
                    top="80px"
                    m="0 40px"
                    position="absolute"
                    spacing="10px"
                  >
                    <Box
                      w="50px"
                      h="100%"
                      bg='rgba(0, 0, 0, 0.5)'
                      zIndex="100"
                      _active={{
                        bg: 'rgba(255, 255, 255, 0.25)'
                      }}
                      onTouchStart={() => {
                        sendBytesToDataChannel(new Uint8Array([0x18]))
                        //navigator.vibrate([50]);
                      }}
                      onTouchEnd={() => {
                        sendBytesToDataChannel(new Uint8Array([0x28]))
                      }}
                    >
                    </Box>
                    <Box
                      w="50px"
                      h="100%"
                      bg='rgba(0, 0, 0, 0.5)'
                      zIndex="100"
                      _active={{
                        bg: 'rgba(255, 255, 255, 0.25)'
                      }}
                      onTouchStart={() => {
                        sendBytesToDataChannel(new Uint8Array([0x19]))
                        //navigator.vibrate([50]);
                      }}
                      onTouchEnd={() => {
                        sendBytesToDataChannel(new Uint8Array([0x29]))
                      }}
                    >
                    </Box>
                  </HStack>

                  <canvas
                    ref={joystickLeft}
                    width="100px"
                    height="100px"
                    style={{
                      left: 0,
                      top: '140px',
                      margin: "0 40px",
                      position: 'absolute',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '50%',
                      zIndex: 101,
                    }}
                  />

                  <VStack
                    position="absolute"
                    m="50px"
                    bottom="0"
                    left="0"
                    w="80px"
                    h="80px"
                    justifyContent="space-between"
                    transform="rotate(45deg)"
                    zIndex="100"
                  >
                    <HStack
                      w="100%"
                      justifyContent="space-between"
                    >
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
                          sendBytesToDataChannel(new Uint8Array([0x10]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x20]))
                        }}
                      >

                      </Box>
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
                          sendBytesToDataChannel(new Uint8Array([0x11]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x21]))
                        }}
                      >

                      </Box>
                    </HStack>
                    <HStack
                      w="100%"
                      justifyContent="space-between"
                    >
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
                          sendBytesToDataChannel(new Uint8Array([0x12]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x22]))
                        }}
                      >

                      </Box>
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
                          sendBytesToDataChannel(new Uint8Array([0x13]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x23]))
                        }}
                      >

                      </Box>
                    </HStack>
                  </VStack>
                </Box>

                <VStack
                  h="calc(100% - 160px)"
                  w="30px"
                  top="80px"
                  left="180px"
                  position="absolute"
                  justifyContent="space-between"
                >
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
                      sendBytesToDataChannel(new Uint8Array([0x1c]))
                      //navigator.vibrate([50]);
                    }}
                    onTouchEnd={() => {
                      sendBytesToDataChannel(new Uint8Array([0x2c]))
                    }}
                  >
                  </Box>
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
                      sendBytesToDataChannel(new Uint8Array([0x1c]))
                      //navigator.vibrate([50]);
                    }}
                    onTouchEnd={() => {
                      sendBytesToDataChannel(new Uint8Array([0x2c]))
                    }}
                  >
                  </Box>
                </VStack>
              </HStack>
              

              <HStack h="100%">

                <VStack
                  h="calc(100% - 160px)"
                  w="30px"
                  top="80px"
                  right="180px"
                  position="absolute"
                  justifyContent="space-between"
                >
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
                      sendBytesToDataChannel(new Uint8Array([0x1d]))
                      //navigator.vibrate([50]);
                    }}
                    onTouchEnd={() => {
                      sendBytesToDataChannel(new Uint8Array([0x2d]))
                    }}
                  >
                  </Box>
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
                      sendBytesToDataChannel(new Uint8Array([0x1e]))
                      //navigator.vibrate([50]);
                    }}
                    onTouchEnd={() => {
                      sendBytesToDataChannel(new Uint8Array([0x2e]))
                    }}
                  >
                  </Box>
                </VStack>

                <Box h="100%">
                  <HStack
                    w="110px"
                    h="40px"
                    top="80px"
                    right="0"
                    m="0 40px"
                    position="absolute"
                    spacing="10px"
                  >
                    <Box
                      w="50px"
                      h="100%"
                      bg='rgba(0, 0, 0, 0.5)'
                      zIndex="100"
                      _active={{
                        bg: 'rgba(255, 255, 255, 0.25)'
                      }}
                      onTouchStart={() => {
                        sendBytesToDataChannel(new Uint8Array([0x1a]))
                        //navigator.vibrate([50]);
                      }}
                      onTouchEnd={() => {
                        sendBytesToDataChannel(new Uint8Array([0x2a]))
                      }}
                    >
                    </Box>
                    <Box
                      w="50px"
                      h="100%"
                      bg='rgba(0, 0, 0, 0.5)'
                      zIndex="100"
                      _active={{
                        bg: 'rgba(255, 255, 255, 0.25)'
                      }}
                      onTouchStart={() => {
                        sendBytesToDataChannel(new Uint8Array([0x1b]))
                        //navigator.vibrate([50]);
                      }}
                      onTouchEnd={() => {
                        sendBytesToDataChannel(new Uint8Array([0x2b]))
                      }}
                    >
                    </Box>
                  </HStack>

                  <VStack
                    position="absolute"
                    m="155px 50px"
                    top="0"
                    right="0"
                    w="80px"
                    h="80px"
                    justifyContent="space-between"
                    transform="rotate(45deg)"
                    zIndex="100"
                  >
                    <HStack
                      w="100%"
                      justifyContent="space-between"
                    >
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
                          sendBytesToDataChannel(new Uint8Array([0x14]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x24]))
                        }}
                      >

                      </Box>
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
                          sendBytesToDataChannel(new Uint8Array([0x15]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x25]))
                        }}
                      >

                      </Box>
                    </HStack>
                    <HStack
                      w="100%"
                      justifyContent="space-between"
                    >
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
                          sendBytesToDataChannel(new Uint8Array([0x16]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x26]))
                        }}
                      >

                      </Box>
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
                          sendBytesToDataChannel(new Uint8Array([0x17]))
                          //navigator.vibrate([50]);
                        }}
                        onTouchEnd={() => {
                          sendBytesToDataChannel(new Uint8Array([0x27]))
                        }}
                      >

                      </Box>
                    </HStack>

                  </VStack>

                  <canvas
                    ref={joystickRight}
                    width="100px"
                    height="100px"
                    style={{
                      right: 0,
                      bottom: 0,
                      margin: "35px 40px",
                      position: 'absolute',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '50%',
                      zIndex: 101,
                    }}
                  />

                </Box>

              </HStack>
              
              
            </HStack>
          )}
          
          <video
            ref={remoteVideo}
            autoPlay
            style={{
              objectFit: "fill",
              width: '100%',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
          </video>
        </div>
      </div>
    </Layout>
  );
}
