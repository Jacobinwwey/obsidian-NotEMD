```mermaid
flowchart TD
    director["Support Director<br/>Front door<br/>triage, escalation"]
    platform["Platform Team<br/>Runtime owner<br/>reliability, deployments"]
    incident["Incident Response<br/>Escalation owner<br/>incidents, postmortems"]
    director --> platform
    director --> inciden
    style incident stroke-dasharray: 5 5
```


