import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useWebRTC } from '../lib/webrtc';
import { Layout } from '../commponents/Layout';
import { ControlBar } from '../commponents/ControlBar';
import { MobileGamepad } from '../commponents/MobileGamepad';
import { GamepadModal } from '../commponents/GamepadModal';

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
  const [showGanpadModal, setShowGanpadModal] = useState<boolean>(false)

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
          <ControlBar
            setIsShowGamepad={setIsShowGamepad}
            setShowGanpadModal={setShowGanpadModal}
          />
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
      <GamepadModal
        showGanpadModal={showGanpadModal}
        setShowGanpadModal={setShowGanpadModal}
      />
    </Layout>
  );
}
