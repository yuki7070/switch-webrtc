#!/usr/bin/env python3
import asyncio
from joycontrol.memory import FlashMemory
from joycontrol.protocol import controller_protocol_factory
from joycontrol.server import create_hid_server
from joycontrol.controller import Controller
from joycontrol.controller_state import ControllerState, button_press, button_release, button_push

import serial

HOST = '127.0.0.1'  # Standard loopback interface address (localhost)
PORT = 65432        # Port to listen on (non-privileged ports are > 1023)

port_name = '/dev/pts/10'
sp = serial.Serial(port_name, 9600)


def debugPrint(message):
    debug = True
    if debug:
        print(message)


async def setup_controller():
    # set up controller -- switch should be in "paired / change grip" menu
    # spi_file = './spi_pro_DC68EBEC1123_Original.bin'
    # spi_flash = None
    # with open(spi_file, 'rb') as spi_flash_file:
    #     spi_flash = FlashMemory(spi_flash_file.read())
    spi_flash = FlashMemory()
    controller = Controller.PRO_CONTROLLER
    factory = controller_protocol_factory(controller, spi_flash=spi_flash)
    # start the emulated controller
    transport, protocol = await create_hid_server(factory, reconnect_bt_addr='70:48:F7:59:3C:63')
    # get a reference to the state being emulated.
    controller_state = protocol.get_controller_state()
    # wait for input to be accepted
    await controller_state.connect()
    # # some sample input
    # controller_state.button_state.set_button('a', True)
    # await controller_state.send()
    return controller_state


async def emulate(controller_state):
    inputs = ['up', 'right', 'left', 'down', 'x', 'a', 'y',
              'b', 'zl', 'l', 'r',  'zr', 'minus', 'plus', 'home']
    l_calibration = controller_state.l_stick_state.get_calibration()
    r_calibration = controller_state.l_stick_state.get_calibration()

    while 1:
        b = sp.read()
        con_type = b[0] >> 7
        #print(con_type)

        if con_type == 0:
            key_type = (b[0] >> 4) & 0b0111
            key_code = b[0] & 0x0f

            if key_type == 1:
                await button_press(controller_state, inputs[key_code])
            elif key_type == 2:
                await button_release(controller_state, inputs[key_code])
            elif key_type == 4:
                joy = sp.read()
                y = joy[0] & 0b1111
                x = joy[0] >> 4
                y_sign = -1 if y >> 3 == 1 else 1
                x_sign = 1 if x >> 3 == 1 else -1
                y_val = y & 0b0111
                x_val = x & 0b0111
                if key_code == 0xb:
                    controller_state.l_stick_state.set_v(
                        (int)((y_val / 7 * y_sign + 1) * 2047.5))
                    controller_state.l_stick_state.set_h(
                        (int)((x_val / 7 * x_sign + 1) * 2047.5))
                if key_code == 0xc:
                    controller_state.r_stick_state.set_v(
                        (int)((y_val / 7 * y_sign + 1) * 2047.5))
                    controller_state.r_stick_state.set_h(
                        (int)((x_val / 7 * x_sign + 1) * 2047.5))

                await controller_state.send()
            elif key_type == 5:
                #print("panmoveend")
                if key_code == 0xb:
                    controller_state.l_stick_state.set_v(2048)
                    controller_state.l_stick_state.set_h(2048)
                if key_code == 0xc:
                    controller_state.r_stick_state.set_v(2048)
                    controller_state.r_stick_state.set_h(2048)
                await controller_state.send()
        
        elif con_type == 1:
            #print('gamepad')
            
            controller_state.button_state.set_button('b', pushed=((b[0] >> 6) & 0b1)) #b
            controller_state.button_state.set_button('a', pushed=((b[0] >> 5) & 0b1)) #a
            controller_state.button_state.set_button('y', pushed=((b[0] >> 4) & 0b1)) #y
            controller_state.button_state.set_button('x', pushed=((b[0] >> 3) & 0b1)) #x
            controller_state.button_state.set_button('l', pushed=((b[0] >> 2) & 0b1)) #x
            controller_state.button_state.set_button('r', pushed=((b[0] >> 1) & 0b1)) #x
            controller_state.button_state.set_button('zl', pushed=((b[0] >> 0) & 0b1)) #x

            b1 = sp.read()
            controller_state.button_state.set_button('zr', pushed=((b1[0] >> 7) & 0b1))  # x
            controller_state.button_state.set_button('minus', pushed=((b1[0] >> 6) & 0b1))  # x
            controller_state.button_state.set_button('plus', pushed=((b1[0] >> 5) & 0b1))  # x
            controller_state.button_state.set_button('l_stick', pushed=((b1[0] >> 4) & 0b1))  # x
            controller_state.button_state.set_button('r_stick', pushed=((b1[0] >> 3) & 0b1))  # x
            controller_state.button_state.set_button('up', pushed=((b1[0] >> 2) & 0b1))  # x
            controller_state.button_state.set_button('down', pushed=((b1[0] >> 1) & 0b1))  # x
            controller_state.button_state.set_button('left', pushed=((b1[0] >> 0) & 0b1))  # x

            b2 = sp.read()
            controller_state.button_state.set_button('right', pushed=((b2[0] >> 7) & 0b1))  # x
            controller_state.button_state.set_button('home', pushed=((b2[0] >> 6) & 0b1))  # x
            #controller_state.button_state.set_button('capture', pushed=((b2[0] >> 2) & 0b1))
            
            b3 = sp.read()
            l_y = b3[0] & 0b1111
            l_x = b3[0] >> 4
            l_y_sign = -1 if l_y >> 3 == 1 else 1
            l_x_sign = 1 if l_x >> 3 == 1 else -1
            l_y_val = l_y & 0b0111
            l_x_val = l_x & 0b0111
            controller_state.l_stick_state.set_v((int)((l_y_val / 7 * l_y_sign + 1) * 2047.5))
            controller_state.l_stick_state.set_h((int)((l_x_val / 7 * l_x_sign + 1) * 2047.5))

            b4 = sp.read()
            r_y = b4[0] & 0b1111
            r_x = b4[0] >> 4
            r_y_sign = -1 if r_y >> 3 == 1 else 1
            r_x_sign = 1 if r_x >> 3 == 1 else -1
            r_y_val = r_y & 0b0111
            r_x_val = r_x & 0b0111
            controller_state.r_stick_state.set_v((int)((r_y_val / 7 * r_y_sign + 1) * 2047.5))
            controller_state.r_stick_state.set_h((int)((r_x_val / 7 * r_x_sign + 1) * 2047.5))

            await controller_state.send()

    return

loop = asyncio.get_event_loop()
state = loop.run_until_complete(setup_controller())
debugPrint('Connected to the Switch!')
loop.run_until_complete(emulate(state))
