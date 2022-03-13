import { useState } from 'react';
import { Box, HStack, Fade, IconButton } from '@chakra-ui/react';
import { MdClose, MdSettings, MdVideogameAsset, MdTouchApp } from 'react-icons/md'
import { useHistory } from 'react-router-dom';

export function ControlBar(props: {
  setIsShowGamepad: (func: (value: boolean) => boolean) => void,
  setShowGanpadModal: (func: (value: boolean) => boolean) => void
}) {
  const [isShowControl, setIsShowControl] = useState<boolean>(false)
  const history = useHistory();
  return (
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
      <Fade in={isShowControl || true}>
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
                props.setShowGanpadModal((prev: boolean) => !prev);
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
                props.setIsShowGamepad((prev: boolean) => !prev)
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
  );
}