// Hook disabled due to runtime error during startup
// Original hook caused: invalid memory address or nil pointer dereference

onRecordAfterUpdateSuccess((e) => {
  e.next();
}, "rooms");