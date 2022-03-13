import React, { ReactNode, useState } from 'react';
import { isSafari } from '../utils/utils';

export type CODEC_TYPE = 'H264' | 'VP8' | 'VP9' | 'AV1'

export type Options = {
  codec: CODEC_TYPE
}

export type WebRTCHook = {
  peerConnection: RTCPeerConnection | null,
  makeOffer: () => void,
  setOffer: (sessionDescription: RTCSessionDescriptionInit) => void,
  setAnswer: (sessionDescription: RTCSessionDescriptionInit) => void,
  addIceCandidate: (candidate: RTCIceCandidate) => void,
  addIceCandidates: (candidate: RTCIceCandidate) => void,
  createdSdp: RTCSessionDescription | null,
  createdIceCandidate: {
    type: string;
    ice: RTCIceCandidate;
  } | null,
  hasReceivedSdp: boolean,
  setCodec: (codec: CODEC_TYPE) => void,
  mediaStream: MediaStream | null,
  dataChannel: RTCDataChannel | null,
  clearPeerConnection: () => void,
}

export const DEFAULT_OPTIONS: Options = {
  codec: 'H264'
}

const WebRTCContext = React.createContext<WebRTCHook | undefined>(undefined)

export const WebRTCProvider: React.FC<{
  options: Options, children: ReactNode
}> = ({options = DEFAULT_OPTIONS, children}) => {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [candidates, setCandidates] = useState<RTCIceCandidate[]>([]);
  const [hasReceivedSdp, setHasReceivedSdp] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [codec, setCodec] = useState<CODEC_TYPE>(options.codec)
  const [createdSdp, setCreatedSdp] = useState<RTCSessionDescription | null>(null)
  const [createdIceCandidate, setCreatedIceCandidate] = useState<{
    type: string;
    ice: RTCIceCandidate;
  } | null>(null)

  // iceServer を定義
  const iceServers = [{ 'urls': 'stun:stun.l.google.com:19302' }];
  // peer connection の 設定
  const peerConnectionConfig = {
    'iceServers': iceServers
  };

  const drainCandidate = () => {
    setHasReceivedSdp(true);
    candidates.forEach((candidate) => {
      addIceCandidate(candidate);
    });
    setCandidates([]);
  }

  const addIceCandidate = (candidate: RTCIceCandidate) => {
    if (peerConnection) {
      peerConnection.addIceCandidate(candidate);
    }
    else {
      console.error('PeerConnection does not exist!');
    }
  }

  const addIceCandidates = (candidate: RTCIceCandidate) => {
    setCandidates((prev) => prev.concat(candidate));
  }

  const sendIceCandidate = (candidate: RTCIceCandidate) => {
    console.log('---sending ICE candidate ---');
    const message = { type: 'candidate', ice: candidate };
    console.log('sending candidate=' + JSON.stringify(message));
    setCreatedIceCandidate(message);
  }

  const prepareNewConnection = () => {
    const peer = new RTCPeerConnection(peerConnectionConfig);
    const dataChannel = peer.createDataChannel("serial");
    setDataChannel(dataChannel)
    if ('ontrack' in peer) {
      if (isSafari()) {
        let tracks: MediaStreamTrack[] = [];
        peer.ontrack = (event) => {
          console.log('-- peer.ontrack()');
          tracks.push(event.track)
          // safari で動作させるために、ontrack が発火するたびに MediaStream を作成する
          let mediaStream = new MediaStream(tracks);
          setMediaStream(mediaStream)
        };
      }
      else {
        let mediaStream = new MediaStream();
        setMediaStream(mediaStream)
        peer.ontrack = (event) => {
          console.log('-- peer.ontrack()');
          mediaStream.addTrack(event.track);
        };
      }
    }

    peer.onicecandidate = (event) => {
      console.log('-- peer.onicecandidate()');
      if (event.candidate) {
        console.log(event.candidate);
        sendIceCandidate(event.candidate);
      } else {
        console.log('empty ice event');
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log('-- peer.oniceconnectionstatechange()');
      console.log('ICE connection Status has changed to ' + peer.iceConnectionState);
      switch (peer.iceConnectionState) {
        case 'closed':
        case 'failed':
        case 'disconnected':
          break;
      }
    };
    peer.addTransceiver('video', { direction: 'recvonly' });
    peer.addTransceiver('audio', { direction: 'recvonly' });

    dataChannel.onmessage = function (event) {
      console.log("Got Data Channel Message:", new TextDecoder().decode(event.data));
    };

    return peer;
  }

  const sendSdp = (sessionDescription: RTCSessionDescription | null) => {
    console.log('---sending sdp ---');
    const message = sessionDescription;
    console.log('sending SDP=' + JSON.stringify(message));
    setCreatedSdp(message);
  }

  const makeOffer = async () => {
    const peerConnection2 = prepareNewConnection();
    setPeerConnection(peerConnection2);
    try {
      const sessionDescription = await peerConnection2.createOffer({
        'offerToReceiveAudio': true,
        'offerToReceiveVideo': true
      })
      console.log('createOffer() success in promise, SDP=', sessionDescription.sdp);

      switch (codec) {
        case 'H264':
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'VP8') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'VP9') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'AV1') as string;
          break;
        case 'VP8':
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'H264') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'VP9') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'AV1') as string;
          break;
        case 'VP9':
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'H264') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'VP8') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'AV1') as string;
          break;
        case 'AV1':
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'H264') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'VP8') as string;
          sessionDescription.sdp = removeCodec(sessionDescription.sdp as string, 'VP9') as string;
          break;
      }

      await peerConnection2.setLocalDescription(sessionDescription);
      console.log('setLocalDescription() success in promise');
      sendSdp(peerConnection2.localDescription);
    } catch (error) {
      console.error('makeOffer() ERROR:', error);
    }
  }

  const makeAnswer = async () => {
    console.log('sending Answer. Creating remote session description...');
    if (!peerConnection) {
      console.error('peerConnection DOES NOT exist!');
      return;
    }
    try {
      const sessionDescription = await peerConnection.createAnswer();
      console.log('createAnswer() success in promise');
      await peerConnection.setLocalDescription(sessionDescription);
      console.log('setLocalDescription() success in promise');
      sendSdp(peerConnection.localDescription);
      drainCandidate();
    } catch (error) {
      console.error('makeAnswer() ERROR:', error);
    }
  }

  // offer sdp を生成する
  const setOffer = (sessionDescription: RTCSessionDescriptionInit) => {

    if (peerConnection) {
      console.error('peerConnection already exists!');
    }

    const peerConnection2 = prepareNewConnection();
    peerConnection2.onnegotiationneeded = async function () {
      try {
        await peerConnection2.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(offer) success in promise');
        makeAnswer();
      } catch (error) {
        console.error('setRemoteDescription(offer) ERROR: ', error);
      }
    }
  }

  const setAnswer = async (sessionDescription: RTCSessionDescriptionInit) => {
    if (!peerConnection) {
      console.error('peerConnection DOES NOT exist!');
      return;
    }
    try {
      await peerConnection.setRemoteDescription(sessionDescription);
      console.log('setRemoteDescription(answer) success in promise');
      drainCandidate();
    } catch (error) {
      console.error('setRemoteDescription(answer) ERROR: ', error);
    }
  }

  // Stack Overflow より引用: https://stackoverflow.com/a/52760103
  // https://stackoverflow.com/questions/52738290/how-to-remove-video-codecs-in-webrtc-sdp
  function removeCodec(orgsdp: string, codec: string) {
    const internalFunc: (sdp: string) => string | void = (sdp: string) => {
      const codecre = new RegExp('(a=rtpmap:(\\d*) ' + codec + '/90000\\r\\n)');
      const rtpmaps = sdp.match(codecre);
      if (rtpmaps == null || rtpmaps.length <= 2) {
        return sdp;
      }
      const rtpmap = rtpmaps[2];
      let modsdp = sdp.replace(codecre, "");

      const rtcpre = new RegExp('(a=rtcp-fb:' + rtpmap + '.*\r\n)', 'g');
      modsdp = modsdp.replace(rtcpre, "");

      const fmtpre = new RegExp('(a=fmtp:' + rtpmap + '.*\r\n)', 'g');
      modsdp = modsdp.replace(fmtpre, "");

      const aptpre = new RegExp('(a=fmtp:(\\d*) apt=' + rtpmap + '\\r\\n)');
      const aptmaps = modsdp.match(aptpre);
      let fmtpmap = "";
      if (aptmaps != null && aptmaps.length >= 3) {
        fmtpmap = aptmaps[2];
        modsdp = modsdp.replace(aptpre, "");

        const rtppre = new RegExp('(a=rtpmap:' + fmtpmap + '.*\r\n)', 'g');
        modsdp = modsdp.replace(rtppre, "");
      }

      let videore = /(m=video.*\r\n)/;
      const videolines = modsdp.match(videore);
      if (videolines != null) {
        //If many m=video are found in SDP, this program doesn't work.
        let videoline = videolines[0].substring(0, videolines[0].length - 2);
        const videoelems = videoline.split(" ");
        let modvideoline = videoelems[0];
        videoelems.forEach((videoelem, index) => {
          if (index === 0) return;
          if (videoelem === rtpmap || videoelem === fmtpmap) {
            return;
          }
          modvideoline += " " + videoelem;
        })
        modvideoline += "\r\n";
        modsdp = modsdp.replace(videore, modvideoline);
      }
      return internalFunc(modsdp);
    }
    return internalFunc(orgsdp);
  }

  const clearPeerConnection = () => {
    if (peerConnection && peerConnection.iceConnectionState !== 'closed') {
      peerConnection.close();
    }
    setPeerConnection(null);
    setCreatedIceCandidate(null);
    setCreatedSdp(null);
  }

  return (
    <WebRTCContext.Provider
      value={{
        peerConnection,
        makeOffer,
        setOffer,
        setAnswer,
        addIceCandidate,
        addIceCandidates,
        createdSdp,
        createdIceCandidate,
        hasReceivedSdp,
        setCodec,
        mediaStream,
        dataChannel,
        clearPeerConnection,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  )
  
}

export const useWebRTC: () => WebRTCHook = () => {
  const ctx = React.useContext(WebRTCContext);
  if (ctx === undefined) {
    throw new Error('There is no webrtc context.')
  }
  return ctx;
}
