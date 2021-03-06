import mocks from '../../../../spec/mocks';
import sut from './keysAction';

describe('keys', () => {
  let socket;

  beforeAll(() => {
    socket = new mocks.SocketMock();
  });

  describe('execute', () => {
    test('should display output when user has no keys', () => {
      // arrange
      socket.character.keys = [];
      const expectedString = '<span class=\'cyan\'>Key ring: </span><span class=\'silver\'>None.</span>';

      // act
      const result = sut.execute(socket.character);

      // assert
      expect(result).toBe(true);
      expect(socket.character.output).toHaveBeenCalledWith(expectedString);
    });

    test('should display user keys when user has keys', () => {
      // arrange
      socket.character.keys = [
        { name: 'KeyOne' },
        { name: 'KeyTwo' },
        { name: 'KeyThree' },
      ];
      const expectedString = '<span class=\'cyan\'>Key ring: </span><span class=\'silver\'>KeyOne, KeyTwo, KeyThree</span>';

      // act
      const result = sut.execute(socket.character);

      // assert
      expect(result).toBe(true);
      expect(socket.character.output).toHaveBeenCalledWith(expectedString);
    });
  });
});
