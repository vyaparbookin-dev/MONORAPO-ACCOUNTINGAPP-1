export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Returns DD/MM/YYYY format common in India
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};