import { useEffect, useRef } from 'react';
import { useWebRTC } from '../lib/webrtc';
import createJs from 'createjs-module'
import Hammer from "hammerjs";
import { throttle } from "lodash";

export function MobileGamepadStick(
  { keyCode }: { keyCode: number }
) {
  const joystick = useRef<HTMLCanvasElement>(null)

  const {
    dataChannel,
  } = useWebRTC();

  useEffect(() => {
    if (dataChannel == null) return;

    const init = () => {
      if (joystick.current)
        initJoyStick(joystick.current);
    }

    dataChannel.addEventListener('open', init)

    return dataChannel.removeEventListener('onopen', init)

  }, [dataChannel])

  const sendBytesToDataChannel = (buf: ArrayBuffer) => {
    if (buf.byteLength === 0) return;
    if (dataChannel == null || dataChannel.readyState !== "open") {
      console.log(dataChannel);
      console.log(buf);
      return;
    }
    dataChannel.send(buf);
  }

  const initJoyStick = (el: HTMLCanvasElement) => {
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

    mc.on("panstart", (ev) => {
      canmove = true;
      sendBytesToDataChannel(new Uint8Array([0x30 | (0x0f & keyCode) ]))
    })

    mc.on("panmove", throttle((ev) => {
      if (!canmove) return;
      const coords = calculateCoords(ev.angle, ev.distance);

      psp.x = coords.x;
      psp.y = coords.y;

      psp.alpha = 0.5;
      
      stage.update();

      const x = Math.round(Math.min(Math.abs(coords.x), 60) / 60 * 7);
      const y = Math.round(Math.min(Math.abs(coords.y), 60) / 60 * 7);

      const val = ((((Number(Math.sign(coords.x) === 1) << 3) | Math.abs(x)) & 0b1111) << 4)
        | (((Number(Math.sign(coords.y) === 1) << 3) | Math.abs(y)) & 0b1111);

      sendBytesToDataChannel(new Uint8Array([0x40 | (0x0f & keyCode), val ]))
    }, 33));
    

    mc.on("panend", (ev) => {
      canmove = false;
      psp.alpha = 0.25;
      createJs.Tween.get(psp).to(
        { x: xCenter, y: yCenter },
        750,
        createJs.Ease.elasticOut
      );
      sendBytesToDataChannel(new Uint8Array([0x50 | (0x0f & keyCode) ]))
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

  return (
    <canvas
      ref={joystick}
      width="100px"
      height="100px"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '50%',
        zIndex: 101,
      }}
    />
  )
}