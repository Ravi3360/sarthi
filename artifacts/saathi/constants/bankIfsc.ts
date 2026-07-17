/** Popular bank branches with IFSC codes for quick selection */
export interface BankBranch {
  bankName: string;
  ifsc: string;
  branch: string;
}

export const bankSuggestions: BankBranch[] = [
  // State Bank of India
  { bankName: 'State Bank of India', ifsc: 'SBIN0000300', branch: 'SBI - दिल्ली मुख्य शाखा' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0001630', branch: 'SBI - मुंबई' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0004266', branch: 'SBI - लखनऊ' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0003343', branch: 'SBI - भोपाल' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0001357', branch: 'SBI - अहमदाबाद' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0005943', branch: 'SBI - पटना' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0001396', branch: 'SBI - जयपुर' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0007458', branch: 'SBI - कानपुर' },

  // Punjab National Bank
  { bankName: 'Punjab National Bank', ifsc: 'PUNB0000100', branch: 'PNB - दिल्ली' },
  { bankName: 'Punjab National Bank', ifsc: 'PUNB0026800', branch: 'PNB - मुंबई' },
  { bankName: 'Punjab National Bank', ifsc: 'PUNB0055900', branch: 'PNB - लखनऊ' },
  { bankName: 'Punjab National Bank', ifsc: 'PUNB0136200', branch: 'PNB - पटना' },
  { bankName: 'Punjab National Bank', ifsc: 'PUNB0056600', branch: 'PNB - भोपाल' },

  // Bank of India
  { bankName: 'Bank of India', ifsc: 'BKID0000123', branch: 'BOI - दिल्ली' },
  { bankName: 'Bank of India', ifsc: 'BKID0000001', branch: 'BOI - मुंबई मुख्य' },
  { bankName: 'Bank of India', ifsc: 'BKID0001217', branch: 'BOI - लखनऊ' },
  { bankName: 'Bank of India', ifsc: 'BKID0001218', branch: 'BOI - पटना' },

  // Bank of Baroda
  { bankName: 'Bank of Baroda', ifsc: 'BARB0NEWDEL', branch: 'BOB - नई दिल्ली' },
  { bankName: 'Bank of Baroda', ifsc: 'BARB0MUMBAI', branch: 'BOB - मुंबई' },
  { bankName: 'Bank of Baroda', ifsc: 'BARB0LUCKNX', branch: 'BOB - लखनऊ' },
  { bankName: 'Bank of Baroda', ifsc: 'BARB0BHOPAL', branch: 'BOB - भोपाल' },
  { bankName: 'Bank of Baroda', ifsc: 'BARB0JAIPUX', branch: 'BOB - जयपुर' },

  // Canara Bank
  { bankName: 'Canara Bank', ifsc: 'CNRB0000001', branch: 'Canara - बेंगलुरु' },
  { bankName: 'Canara Bank', ifsc: 'CNRB0001022', branch: 'Canara - दिल्ली' },
  { bankName: 'Canara Bank', ifsc: 'CNRB0001052', branch: 'Canara - मुंबई' },

  // Union Bank
  { bankName: 'Union Bank of India', ifsc: 'UBIN0530360', branch: 'Union Bank - दिल्ली' },
  { bankName: 'Union Bank of India', ifsc: 'UBIN0530000', branch: 'Union Bank - मुंबई' },
  { bankName: 'Union Bank of India', ifsc: 'UBIN0556734', branch: 'Union Bank - लखनऊ' },

  // HDFC Bank
  { bankName: 'HDFC Bank', ifsc: 'HDFC0000001', branch: 'HDFC - मुंबई' },
  { bankName: 'HDFC Bank', ifsc: 'HDFC0000002', branch: 'HDFC - दिल्ली' },
  { bankName: 'HDFC Bank', ifsc: 'HDFC0001954', branch: 'HDFC - लखनऊ' },
  { bankName: 'HDFC Bank', ifsc: 'HDFC0001234', branch: 'HDFC - भोपाल' },
  { bankName: 'HDFC Bank', ifsc: 'HDFC0000145', branch: 'HDFC - अहमदाबाद' },

  // ICICI Bank
  { bankName: 'ICICI Bank', ifsc: 'ICIC0000001', branch: 'ICICI - मुंबई' },
  { bankName: 'ICICI Bank', ifsc: 'ICIC0000002', branch: 'ICICI - दिल्ली' },
  { bankName: 'ICICI Bank', ifsc: 'ICIC0006691', branch: 'ICICI - लखनऊ' },
  { bankName: 'ICICI Bank', ifsc: 'ICIC0000661', branch: 'ICICI - अहमदाबाद' },

  // Axis Bank
  { bankName: 'Axis Bank', ifsc: 'UTIB0000001', branch: 'Axis - मुंबई' },
  { bankName: 'Axis Bank', ifsc: 'UTIB0000002', branch: 'Axis - दिल्ली' },
  { bankName: 'Axis Bank', ifsc: 'UTIB0000463', branch: 'Axis - लखनऊ' },

  // Kotak Mahindra Bank
  { bankName: 'Kotak Mahindra Bank', ifsc: 'KKBK0000001', branch: 'Kotak - मुंबई' },
  { bankName: 'Kotak Mahindra Bank', ifsc: 'KKBK0000002', branch: 'Kotak - दिल्ली' },

  // Indian Bank
  { bankName: 'Indian Bank', ifsc: 'IDIB000A001', branch: 'Indian Bank - चेन्नई' },
  { bankName: 'Indian Bank', ifsc: 'IDIB000D001', branch: 'Indian Bank - दिल्ली' },

  // Central Bank of India
  { bankName: 'Central Bank of India', ifsc: 'CBIN0280001', branch: 'Central Bank - मुंबई' },
  { bankName: 'Central Bank of India', ifsc: 'CBIN0280002', branch: 'Central Bank - दिल्ली' },
  { bankName: 'Central Bank of India', ifsc: 'CBIN0283131', branch: 'Central Bank - भोपाल' },

  // UCO Bank
  { bankName: 'UCO Bank', ifsc: 'UCBA0000001', branch: 'UCO - कोलकाता' },
  { bankName: 'UCO Bank', ifsc: 'UCBA0000002', branch: 'UCO - दिल्ली' },
];

/** Keyword → matching bank suggestions */
export function searchBankSuggestions(query: string): BankBranch[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const seen = new Set<string>();
  const results: BankBranch[] = [];
  for (const b of bankSuggestions) {
    if (
      b.bankName.toLowerCase().includes(q) ||
      b.ifsc.toLowerCase().includes(q) ||
      (q === 'sbi' && b.bankName.includes('State Bank')) ||
      (q === 'pnb' && b.bankName.includes('Punjab National')) ||
      (q === 'boi' && b.bankName.includes('Bank of India') && !b.bankName.includes('Baroda')) ||
      (q === 'bob' && b.bankName.includes('Baroda')) ||
      (q === 'hdfc' && b.bankName.includes('HDFC')) ||
      (q === 'icici' && b.bankName.includes('ICICI')) ||
      (q === 'axis' && b.bankName.includes('Axis')) ||
      (q === 'kotak' && b.bankName.includes('Kotak')) ||
      (q === 'uco' && b.bankName.includes('UCO')) ||
      (q === 'ubi' && b.bankName.includes('Union')) ||
      (q === 'cnb' && b.bankName.includes('Canara'))
    ) {
      if (!seen.has(b.ifsc)) {
        seen.add(b.ifsc);
        results.push(b);
      }
    }
  }
  return results.slice(0, 6);
}
