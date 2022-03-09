import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useWebRTC } from '../lib/webrtc';
import { Layout } from '../commponents/Layout';
import { ControlBar } from '../commponents/ControlBar';
import { MobileGamepad } from '../commponents/MobileGamepad';

export function Stream() {
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socketUrl = 'ws://192.168.3.15:8080/ws';
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(socketUrl, { share: true });
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
/*
  const sendTextToDataChannel = (txt: string) => {
    if (txt.length === 0) return;
    if (dataChannel == null || dataChannel.readyState !== "open") {
      console.log(txt);
      return;
    }
    dataChannel.send(new TextEncoder().encode(txt));
  }
*/
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
/*
  const play = () => {
    if (remoteVideo.current) {
      remoteVideo.current.play();
    }
  }
*/
  useEffect(() => {
    connect();
    return disconnect;
  }, []);

  const [isShowGamepad, setIsShowGamepad] = useState<boolean>(true)

  //gamepad
  const [joyConGamePad, setJoyConGamePad] = useState<number | undefined>(undefined)
  useEffect(() => {
    let joyConGamePadLoopID = 0;

    if (dataChannel == null || dataChannel.readyState === 'closed') {
      cancelAnimationFrame(joyConGamePadLoopID)
      return;
    }
    
    window.addEventListener('gamepadconnected', (e) => {
      console.log(e.gamepad)
      if (e.gamepad.id !== 'Joy-Con L+R (STANDARD GAMEPAD Vendor: 057e Product: 200e)' && 
        e.gamepad.id !== 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)') {
        return;
      }
      if (joyConGamePad !== undefined) return;
      const gpIndex = e.gamepad.index;
      setJoyConGamePad(e.gamepad.index);

      const frameTime = 1/60;

      let prevTimestamp = 0;
      
      const loop = (timestamp: number) => {
        const elapsed = (timestamp - prevTimestamp) / 1000;
        if (elapsed <= frameTime) {
          joyConGamePadLoopID = requestAnimationFrame(loop);
          return;
        }

        prevTimestamp = timestamp;

        const gamepads = navigator.getGamepads();
        const gp = gamepads[gpIndex];
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

        sendBytesToDataChannel(
          new Uint8Array([key >> 16, key >> 8, key & 0xff, ls, rs])
        )
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
          <ControlBar setIsShowGamepad={setIsShowGamepad}/>
          {isShowGamepad &&
            navigator.userAgent.match(/iPhone|Android.+Mobile/) && (
            <MobileGamepad />
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
