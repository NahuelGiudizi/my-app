export function getAvailableTimeSlots(date: Date, duration: number) {
    const timeSlots = [];
    const startHour = 9; // Hora de inicio (9 AM)
    const endHour = 18; // Hora de fin (6 PM)
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(date);
        time.setHours(hour, minute, 0, 0);
        
        // No agregar slots para tiempo pasado
        if (time > new Date()) {
          timeSlots.push(time);
        }
      }
    }
    
    return timeSlots;
  }