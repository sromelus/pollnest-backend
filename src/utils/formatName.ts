export function splitFullName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) { return { firstName: '', lastName: '' }; }

    const nameParts = fullName.trim().split(/\s+/);
    return {
        firstName: nameParts.length > 2 ? nameParts.slice(0, 2).join(' ') : nameParts[0],
        lastName: nameParts.length > 2 ? nameParts.slice(2).join(' ') : nameParts.length > 1 ? nameParts[1] : ''
    };
}