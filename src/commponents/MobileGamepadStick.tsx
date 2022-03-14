import { useEffect, useRef } from 'react';
import { useWebRTC } from '../lib/webrtc';
import createJs from 'createjs-module'
import { throttle } from "lodash";

export function MobileGamepadStick(
  { keyCode }: { keyCode: number }
) {
  const joystick = useRef<HTMLCanvasElement>(null!);
  const canMove = useRef<boolean>(null!);
  const stage = useRef<createJs.Stage>(null!);
  const psp = useRef<createJs.Shape>(null!);
  const center = useRef<{ x: number, y: number}>(null!);
  const touchStartPos = useRef<{ x: number, y: number}>(null!);

  const {
    dataChannel,
  } = useWebRTC();

  useEffect(() => {
    initJoyStick(joystick.current);
  }, [])

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
    center.current = { x: 50, y: 50 };
    stage.current = new createJs.Stage(el);
    
    psp.current = new createJs.Shape();
    psp.current.graphics.beginFill('#fff').drawCircle(
      center.current.x, center.current.y, 30);
    psp.current.alpha = 0.5;

    stage.current.addChild(psp.current);

    createJs.Ticker.framerate = 30;
    createJs.Ticker.addEventListener('tick', stage.current);
    stage.current.update();

    center.current = { x: el.clientTop, y: el.clientLeft };
    psp.current.alpha = 0.5;

    stage.current.update();

    canMove.current = false;

  }

  const calculateCoords = (ev: React.Touch) => {
    const x = ev.clientX - touchStartPos.current.x;
    const y = ev.clientY - touchStartPos.current.y;
    let distance = Math.sqrt(x**2+y**2);

    var coords: any = {};
    distance = Math.min(distance, 50);
    var rads = Math.atan2(y, x);

    coords.x = distance * Math.cos(rads);
    coords.y = distance * Math.sin(rads);

    return coords;
  }

  const onTouchStartHandler = (ev: React.TouchEvent<HTMLCanvasElement>) => {
    canMove.current = true;
    touchStartPos.current = {
      x: ev.targetTouches[0].clientX,
      y: ev.targetTouches[0].clientY,
    };
    sendBytesToDataChannel(new Uint8Array([0x30 | (0x0f & keyCode) ]))
  }

  const onTouchMoveHandler = throttle((ev: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canMove.current) return;
    const coords = calculateCoords(ev.targetTouches[0]);

    psp.current.x = coords.x;
    psp.current.y = coords.y;

    psp.current.alpha = 0.5;
      
    stage.current.update();

    const x = Math.round(Math.abs(coords.x) / 50 * 7);
    const y = Math.round(Math.abs(coords.y) / 50 * 7);

    const val = ((((Number(Math.sign(coords.x) === 1) << 3) | Math.abs(x)) & 0b1111) << 4)
      | (((Number(Math.sign(coords.y) === 1) << 3) | Math.abs(y)) & 0b1111);

    sendBytesToDataChannel(new Uint8Array([0x40 | (0x0f & keyCode), val ]))
  }, 33)

  const onTouchEndHandler = () => {
    canMove.current = false;
    psp.current.alpha = 0.25;
    createJs.Tween.get(psp.current).to(
      center.current,
      750,
      createJs.Ease.elasticOut
    );
    sendBytesToDataChannel(new Uint8Array([0x50 | (0x0f & keyCode) ]))
  }

  return (
    <canvas
      ref={joystick}
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
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