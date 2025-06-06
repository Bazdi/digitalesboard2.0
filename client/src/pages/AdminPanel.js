const simulateProgress = (type, duration = 10000) => {
  setSyncProgress({
    show: true,
    type: type,
    progress: 0,
    status: 'Starte Synchronisation...',
    details: {}
  });

  const steps = [
    { progress: 10, status: 'Verbindung zu work4all...' },
    { progress: 25, status: 'Lade Daten von work4all...' },
    { progress: 50, status: 'Verarbeite Daten...' },
    { progress: 75, status: 'Synchronisiere zur Datenbank...' },
    { progress: 90, status: 'Finalisiere...' },
    { progress: 100, status: 'Abgeschlossen!' }
  ];

  let currentStep = 0;
  const stepDuration = duration / steps.length;

  const interval = setInterval(() => {
    if (currentStep < steps.length && steps[currentStep]) {
      setSyncProgress(prev => ({
        ...prev,
        progress: steps[currentStep].progress,
        status: steps[currentStep].status
      }));
      currentStep++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        setSyncProgress(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  }, stepDuration);

  return interval;
}; 