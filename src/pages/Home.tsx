import {
  useHistory,
} from 'react-router-dom';
import { useWebRTC } from '../lib/webrtc';
import { Layout } from "../commponents/Layout";
import './Home.css';
import { useEffect, useRef } from 'react';
import { Button, VStack, HStack } from '@chakra-ui/react'

export function Home() {
  const history = useHistory();
  const { clearPeerConnection } = useWebRTC();
  const checkbox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearPeerConnection();
  }, [])

  return (
    <Layout>
      <input
        ref={checkbox}
        id="screen"
        name="screen"
        type="checkbox"
      />
      <main className="nintendo-switch">
        
        <aside className="actions left">
          <i className="minus">-</i>
          <div className="analogic">
            <div className="center-circle"></div>
          </div>
          <div className="buttons">
            <button></button>
            <button></button>
            <button></button>
            <button></button>
          </div>
          <div className="square"></div>
        </aside>

        <div className="middle">
          <div className="screen">
            <div className="glass"></div>
          </div>
          <VStack
            position="absolute"
            width="100%"
            height="100%"
            p="50px"
            justifyContent="center"
            zIndex="100"
            spacing="10px"
          >
            <Button
              isFullWidth
              backgroundColor="rgba(79, 209, 197,0.8)"
              variant='solid'
              height="30%"
              fontSize="3xl"
              fontWeight="200"
              onClick={() => {
                if (checkbox.current) {
                  checkbox.current.checked = true;
                }
                history.push('/stream')
              }}
            >
              CONNECT
            </Button>
            <HStack w="100%" h="20%">
              <Button
                isFullWidth
                backgroundColor="rgba(79, 209, 197,0.8)"
                variant='solid'
                height="100%"
                fontWeight="200"
              >
                配信設定
              </Button>
              <Button
                isFullWidth
                backgroundColor="rgba(79, 209, 197,0.8)"
                variant='solid'
                height="100%"
                fontWeight="200"
              >
                操作設定
              </Button>
            </HStack>
          </VStack>
          
        </div>
        
        <aside className="actions right">
          <i className="plus">+</i>
          <div className="analogic">
            <div className="center-circle"></div>
          </div>
          <div className="buttons">
            <button></button>
            <button></button>
            <button></button>
            <button></button>
          </div>
          <div className="circle"></div>
        </aside>
        
      </main>
    </Layout>
    
  );
}
