/**
 * Converts a number to Indian currency words format (e.g. ₹1,57,500 -> "One Lakh Fifty Seven Thousand Five Hundred Rupees Only")
 */
export const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    const numInt = Math.floor(n);
    if (numInt === 0) return 'Zero ';

    const crore = Math.floor(numInt / 10000000);
    const lakh = Math.floor((numInt % 10000000) / 100000);
    const thousand = Math.floor((numInt % 100000) / 1000);
    const hundred = Math.floor((numInt % 1000) / 100);
    const rest = numInt % 100;

    if (crore > 0) {
      str += inWords(crore) + 'Crore ';
    }
    if (lakh > 0) {
      str += inWords(lakh) + 'Lakh ';
    }
    if (thousand > 0) {
      str += inWords(thousand) + 'Thousand ';
    }
    if (hundred > 0) {
      str += inWords(hundred) + 'Hundred ';
    }
    if (rest > 0) {
      if (rest < 20) {
        str += a[rest];
      } else {
        str += b[Math.floor(rest / 10)] + (rest % 10 ? ' ' + a[rest % 10] : ' ');
      }
    }
    return str;
  };

  const amount = parseFloat(num);
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = inWords(rupees).trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + inWords(paise).trim() + ' Paise';
  }
  result += ' Only';

  return result.replace(/\s+/g, ' ');
};
