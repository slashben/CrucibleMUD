import Room, { mockGetById, mockValidDirectionInput, mockShortToLong, mockLongToShort } from '../models/room';
import { mockSocketInRoom, mockRoomMessage, mockGetSocketByUsername, mockGetSocketByUserId, mockGetFollowingSockets, mockGetRoomSockets, mockValidUserInRoom } from '../core/socketUtil';
import { mockAutocompleteTypes } from '../core/autocomplete';
import mocks from '../../spec/mocks';
import sut from './telepathy';


jest.mock('../models/room');
jest.mock('../core/autocomplete');
jest.mock('../core/socketUtil');


global.io = new mocks.IOMock();


describe('telepathy', () => {
  let socket;
  let otherSocket;

  beforeAll(() => {
    socket = new mocks.SocketMock();
    socket.user = { roomId: 123, username: 'TestUser' };
    otherSocket = new mocks.SocketMock();
    otherSocket.user = { roomId: 321, username: 'OtherUser' };
  });

  describe('execute', () => {

    test('should output messages when user is invalid', () => {
      // arrange
      const msg = 'This is a telepath message!';
      mockGetSocketByUsername.mockReturnValueOnce(null);

      // act
      sut.execute(socket, 'Wrong', msg);

      // assert
      expect(socket.emit).toBeCalledWith('output', { message: 'Invalid username.' });
    });

    test('should output messages when command is successful', () => {
      // arrange
      const msg = 'This is a telepath message!';
      mockGetSocketByUsername.mockReturnValueOnce(otherSocket);

      // act
      sut.execute(socket, otherSocket.username, msg);

      // assert
      expect(socket.emit).toBeCalledWith('output', { message: 'Telepath to OtherUser: This is a telepath message!' });
      expect(otherSocket.emit).toBeCalledWith('output', { message: 'TestUser telepaths: This is a telepath message!' });
    });

  });

});
