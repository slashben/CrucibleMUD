import { mockGetRoomById } from '../../../models/room';
import { mockAutocompleteMultiple } from '../../../core/autocomplete';
import Item from '../../../models/item';
import mocks from '../../../../spec/mocks';
import sut from './dropAction';

jest.mock('../../../models/room');
jest.mock('../../../core/autocomplete');

let mockRoom = mocks.getMockRoom();


describe('drop', () => {
  let socket;
  let item;
  let key;
  let invalidItem;

  beforeAll(() => {
    // just a matcher that works like toEqual, but does not do a type check.
    // This just compares the json representation of the objects being compared.
    jasmine.addMatchers({
      toBeJsonEqual() {
        return {
          compare(actual, expected) {
            let result = {};
            let jsonActual = JSON.orderedStringify(actual);
            let jsonExpected = JSON.orderedStringify(expected);
            result.pass = jsonActual === jsonExpected;
            if (result.pass) {
              result.message = `Expected ${jsonActual} to equal ${jsonExpected}`;
            } else {
              result.message = `Expected ${jsonActual} to equal ${jsonExpected}`;
            }
            return result;
          },
        };
      },
    });
  });

  beforeEach(() => {
    mockRoom.reset();
    mockGetRoomById.mockReturnValueOnce(mockRoom);
    socket = new mocks.SocketMock();

    item = new Item();
    item.name = 'dummyItem';
    item.type = 'item';
    item.name = 'dropItem';

    key = new Item();
    key.name = 'dummyKey';
    key.type = 'key';
    key.name = 'dropKey';

    invalidItem = new Item();
    invalidItem.name = 'invalidItem';
    invalidItem.type = 'InvalidType';
    invalidItem.name = 'invalidname';

    socket.character.inventory = [item];
    socket.character.keys = [key];
    mockRoom.inventory = [];
  });

  describe('execute', () => {

    describe('when item.type is item', () => {

      test('should output error message whmockAutocompleteMultiple.mocken item is not found in user inventory', () => {
        mockAutocompleteMultiple.mockReturnValueOnce(null);


        sut.execute(socket.character, null);

        expect(socket.character.save).not.toHaveBeenCalled();
        expect(mockRoom.save).not.toHaveBeenCalled();
        expect(socket.character.output).toHaveBeenCalledWith('You don\'t seem to be carrying that.');
      });

      test('should remove item from user inventory and add to room inventory', () => {
        let autocompleteResult = {
          type: 'item',
          item,
        };
        mockAutocompleteMultiple.mockReturnValueOnce(autocompleteResult);

        sut.execute(socket.character, item);

        expect(socket.character.save).toHaveBeenCalled();
        expect(mockRoom.save).toHaveBeenCalled();
        expect(socket.character.inventory).toHaveLength(0);
        expect(mockRoom.inventory[0].name).toEqual(item.name);
        expect(socket.character.toRoom).toHaveBeenCalledWith('TestUser drops dropItem.', [socket.character.id]);
        expect(socket.character.output).toHaveBeenCalledWith('Dropped.');
      });
    });

    describe('when item.type is key', () => {
      test('should remove key from user keys and add to room inventory', () => {
        let autocompleteResult = {
          type: 'key',
          item: key,
        };
        mockAutocompleteMultiple.mockReturnValueOnce(autocompleteResult);
        socket.character.keys = [autocompleteResult.item];

        sut.execute(socket.character, key);

        expect(socket.character.save).toHaveBeenCalled();
        expect(mockRoom.save).toHaveBeenCalled();
        expect(socket.character.keys).toHaveLength(0);
        expect(mockRoom.inventory[0].name).toEqual(key.name);
        expect(socket.character.toRoom).toHaveBeenCalledWith('TestUser drops dropKey.', [socket.character.id]);
        expect(socket.character.output).toHaveBeenCalledWith('Dropped.');
      });
    });
  });
});
