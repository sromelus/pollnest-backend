import { splitFullName } from '../../src/utils/formatName';

describe('splitFullName', () => {
    it('should split the full name into first and last name', () => {
        const result = splitFullName('John Doe');

        expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('should split the full name into first and last name with middle name', () => {
        const result = splitFullName('John Doe Smith');

        expect(result).toEqual({ firstName: 'John Doe', lastName: 'Smith' });
    });

    it('should return the first name if only one name is provided', () => {
        const result = splitFullName('John');
        expect(result).toEqual({ firstName: 'John', lastName: '' });
    });

    it('should fail if firstName not included middle name when more than 2 names are provided', () => {
        const result = splitFullName('John Doe Smith');

        expect(result).not.toEqual({ firstName: 'John', lastName: 'Smith' });
    });

    it('should return empty string if no name is provided', () => {
        const result = splitFullName('');
        expect(result).toEqual({ firstName: '', lastName: '' });
    });
});