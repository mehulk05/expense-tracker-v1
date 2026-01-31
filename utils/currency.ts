/**
 * Formats a number as an Indian currency string (e.g., ₹1,00,000).
 * @param amount The number to format.
 * @param decimals Optional number of decimal places (default 0 for cleanliness, can be overridden).
 * @returns Formatted currency string.
 */
export const formatCurrency = (amount: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
    }).format(amount);
};

export const formatNumber = (amount: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
    }).format(amount);
};

export const formatInputAmount = (value: string): string => {
    if (!value) return '';
    // Remove existing commas to get raw number parts
    const cleanValue = value.replace(/,/g, '');
    const [integerPart, decimalPart] = cleanValue.split('.');

    // Format integer part
    const formattedInteger = integerPart ? parseInt(integerPart).toLocaleString('en-IN') : '';

    // Return with decimal part if it existed (handling "123." case)
    if (decimalPart !== undefined) {
        return `${formattedInteger}.${decimalPart}`;
    }
    return formattedInteger;
};
