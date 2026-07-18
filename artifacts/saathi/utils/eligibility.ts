import type { EligibilityCheck, GovtScheme } from '@/types/scheme';
import type { WorkerProfile } from '@/types/worker';
import { calculateAge } from '@/utils/format';

export function checkEligibility(
  scheme: GovtScheme,
  worker: WorkerProfile,
): EligibilityCheck {
  const reasons: EligibilityCheck['reasons'] = [];
  const age = calculateAge(worker.dob);
  const { eligibility } = scheme;

  if (eligibility.minAge !== null || eligibility.maxAge !== null) {
    const min = eligibility.minAge ?? 0;
    const max = eligibility.maxAge ?? 200;
    const pass = age !== null && age >= min && age <= max;
    reasons.push({
      label: 'उम्र',
      pass,
      detail: age !== null ? `${age} साल` : 'दर्ज नहीं',
    });
  }

  if (eligibility.gender !== 'any') {
    const pass = worker.gender === eligibility.gender;
    reasons.push({
      label: 'लिंग',
      pass,
      detail: worker.gender ?? 'दर्ज नहीं',
    });
  }

  if (eligibility.occupationTags.length > 0) {
    const pass = eligibility.occupationTags.includes(worker.occupation);
    reasons.push({
      label: 'व्यवसाय',
      pass,
      detail: worker.occupation || 'दर्ज नहीं',
    });
  }

  if (eligibility.incomeCeiling !== null) {
    const income = worker.expectedSalary ?? 0;
    const pass = income > 0 && income <= eligibility.incomeCeiling;
    reasons.push({
      label: 'आय सीमा',
      pass,
      detail: income > 0 ? `₹${income}/महीना` : 'दर्ज नहीं',
    });
  }

  if (eligibility.migrationRequired !== null) {
    const isMigrant = worker.migrationStatus === 'migrant';
    const pass = isMigrant === eligibility.migrationRequired;
    reasons.push({
      label: 'प्रवासन स्थिति',
      pass,
      detail: worker.migrationStatus ?? 'दर्ज नहीं',
    });
  }

  const eligible = reasons.length === 0 || reasons.every((r) => r.pass);
  return { eligible, reasons };
}
