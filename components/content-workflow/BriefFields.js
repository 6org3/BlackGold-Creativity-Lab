export default function BriefFields({ brief, fields, onChange }) {
  return fields.map((field) => {
    const Control = field.type === 'textarea' ? 'textarea' : 'input';
    return (
      <label className="field field-wide" key={field.key}>
        <span>{field.label}{field.required ? ' · obligatorio' : ' · opcional'}</span>
        <Control
          maxLength={4000}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'textarea' ? 4 : undefined}
          value={brief[field.key] || ''}
        />
      </label>
    );
  });
}
