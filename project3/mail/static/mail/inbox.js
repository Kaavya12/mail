document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  console.log('Loading')
  load_mailbox('inbox');
});

function compose_email() {

  document.querySelector('#compose-form').onsubmit = () => {
    //return false
    fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
      })
    })
    .then(response => response.json())
    .then(result => {
        window.alert(`${result.message}`)
        load_mailbox('sent')
    });

    return false;  
  }
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-display').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-display').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  function show_email(mailbox, email_id){
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      console.log(email);
      // ... do something else with email ...
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#emails-display').style.display = 'block';
      if (mailbox === 'inbox'){
        console.log(email.body)
        document.querySelector('#emails-display').innerHTML = 
        `
        <h6>From: ${email.sender} 
        <h6>To: ${email.recipients} 
        <h6>Subject: ${email.subject} 
        <h6>Timestamp: ${email.timestamp}
        <hr>
        <button class="btn btn-sm btn-outline-primary archive" data-id='${email.id}'>Archive</button>
        <button class="btn btn-sm btn-outline-primary reply" data-id='${email.id}'>Reply</button>
        <hr>
        <div class='email_body'>${email.body}</div>
        
        `;

        document.querySelectorAll('.archive').forEach(button => {
          button.onclick = function(){
            req_id = this.dataset.id
            fetch(`/emails/${req_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: true
                  })
              })
            window.alert("Message archived. ")
            load_mailbox('inbox')
          }
        })
      }else if(mailbox==='sent'){
        document.querySelector('#emails-display').innerHTML = 
        `
        <h6>From: ${email.sender} 
        <h6>To: ${email.recipients} 
        <h6>Subject: ${email.subject} 
        <h6>Timestamp: ${email.timestamp}
        <button class="btn btn-sm btn-outline-primary reply" data-id='${email.id}'>Reply</button>
        <hr>
        <div class='email_body'>${email.body}</div>
        
        `;

      }else{
        
        document.querySelector('#emails-display').innerHTML = 
        `
        <h6>From: ${email.sender} 
        <h6>To: ${email.recipients} 
        <h6>Subject: ${email.subject} 
        <h6>Timestamp: ${email.timestamp}
        <hr>
        <button class="btn btn-sm btn-outline-primary unarchive" data-id='${email.id}'>Unarchive</button>
        <button class="btn btn-sm btn-outline-primary reply" data-id='${email.id}'>Reply</button>
        <hr>
        <div class='email_body'>${email.body}</div>
        
        `;

        document.querySelectorAll('.unarchive').forEach(button => {
          button.onclick = function(){
            req_id = this.dataset.id
            fetch(`/emails/${req_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: false
                  })
              })
              window.alert("Message unarchived. ")
              load_mailbox('inbox')
          }
        })
      }


      document.querySelectorAll('.reply').forEach(button => {
        button.onclick = function(){
          req_id = this.dataset.id
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'block';
          document.querySelector('#emails-display').style.display = 'none';
          
          fetch(`/emails/${req_id}`)
          .then(response => response.json())
          .then(email => {
            // Print email
            console.log(email);

            document.querySelector('#compose-form').onsubmit = () => {
            //return false
            fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value,
              })
            })
            .then(response => response.json())
            .then(result => {
                window.alert(`${result.message}`)
                load_mailbox('sent')
            });

            return false;  
          }

            document.querySelector('#compose-recipients').value = `${email.sender}`
            if (email.subject.substring(0,3) === 'Re:'){
              subject = email.subject
            }else{
              subject = `Re: ${email.subject}`
            }
            document.querySelector('#compose-subject').value = `${subject}`
            document.querySelector('#compose-subject').disabled = true
            document.querySelector('#compose-body').value = 
            `On ${email.timestamp}, ${email.sender} wrote: 
${email.body}`
          })

        }
      })
    });
  }

  function show_all_emails(mailbox, emails){
    emails.forEach((email) => {
          const element = document.createElement('div');
          element.setAttribute('id', `${email.id}`);

          if (email.read === true){
            element.setAttribute("class", "row each-mail read");
          }else{
            element.setAttribute("class", "row each-mail unread");
          }

          element.innerHTML = 
            `<h5 class='col-md-3' id="sender-name">${email.sender}</h5> 
            <p class="col-md-5" id="subject">${email.subject}</p> 
            <p class='col-md-4'>${email.timestamp}</p>`;

          document.querySelector('#emails-view').append(element);
                  
          document.querySelectorAll('.each-mail').forEach(div => {  
            div.onclick = function(){
              fetch(`/emails/${this.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  read: true
                  })
              })
              show_email(mailbox, this.id)
            }
          })

          
        })
  }

  if (mailbox === 'inbox'){
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);

        // ... do something else with emails ...
        show_all_emails(mailbox, emails)
    });

  }else if (mailbox === 'archive') {
    fetch('/emails/archive')
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);

        // ... do something else with emails ...
         show_all_emails(mailbox, emails)
    });
  } else {
    fetch('/emails/sent')
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);

        // ... do something else with emails ...
         show_all_emails(mailbox, emails)
    });
  }
}

    