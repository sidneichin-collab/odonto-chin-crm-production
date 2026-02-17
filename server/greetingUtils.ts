// Greeting Utils
// TODO: Implement greeting utilities

export function getGreeting(patientName: string): string {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour < 12) {
    greeting = 'Buenos días';
  } else if (hour < 18) {
    greeting = 'Buenas tardes';
  } else {
    greeting = 'Buenas noches';
  }
  
  return `${greeting}, ${patientName}! 😊`;
}

export function getRandomGreeting(patientName: string): string {
  const greetings = [
    `Hola ${patientName}! 👋`,
    `Saludos ${patientName}! 😊`,
    `Qué tal ${patientName}! 🙂`,
    getGreeting(patientName),
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}
