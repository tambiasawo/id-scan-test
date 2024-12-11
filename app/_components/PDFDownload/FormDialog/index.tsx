import * as React from "react";

export default function FormDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div style={{ width:'100%' }}>
      <button onClick={handleClickOpen}>Send to Myself</button>
      {open && (
        <div style={{ position: "absolute",width:'100%',background:'#fff' }}>
          <h2>Send to Myself</h2>
          <div>
            Enter your email address and click send to send this report to
            yourself
          </div>
          <input
            autoFocus
            required
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <div>
            <button onClick={handleClose}>Cancel</button>
            <button type="submit">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
