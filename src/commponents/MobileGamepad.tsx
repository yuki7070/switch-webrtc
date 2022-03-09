import { Box, HStack, VStack } from '@chakra-ui/react';
import { MobileGamepadCircleButton } from './MobileGamepadCircleButton'
import { MobileGamepadRectButton } from './MobileGamepadRectButton'
import { MobileGamepadStick } from './MobileGamepadStick'

export function MobileGamepad() {
  return (
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
            <MobileGamepadRectButton keyCode={8} />
            <MobileGamepadRectButton keyCode={9} />
          </HStack>

          <Box
            w="100px"
            h="100px"
            position="absolute"
            top="140px"
            m="0 40px"
            left="0"
            zIndex="100"
          >
            <MobileGamepadStick keyCode={0xb}/>
          </Box>
          
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
              <MobileGamepadCircleButton keyCode={0} />
              <MobileGamepadCircleButton keyCode={1} />
            </HStack>
            <HStack
              w="100%"
              justifyContent="space-between"
            >
              <MobileGamepadCircleButton keyCode={2} />
              <MobileGamepadCircleButton keyCode={3} />
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
          <MobileGamepadCircleButton keyCode={0xc} />
          <MobileGamepadCircleButton keyCode={0xc} />
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
          <MobileGamepadCircleButton keyCode={0xd} />
          <MobileGamepadCircleButton keyCode={0xe} />
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
            <MobileGamepadRectButton keyCode={0xa} />
            <MobileGamepadRectButton keyCode={0xb} />
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
              <MobileGamepadCircleButton keyCode={4} />
              <MobileGamepadCircleButton keyCode={5} />
            </HStack>
            <HStack
              w="100%"
              justifyContent="space-between"
            >
              <MobileGamepadCircleButton keyCode={6} />
              <MobileGamepadCircleButton keyCode={7} />
            </HStack>
          </VStack>
          <Box
            w="100px"
            h="100px"
            position="absolute"
            bottom="0"
            m="35px 40px"
            right="0"
            zIndex="100"
          >
            <MobileGamepadStick keyCode={0xc}/>
          </Box>
        </Box>
      </HStack>
    </HStack>
  )
}