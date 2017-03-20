{
  "targets": [
    {
      "target_name": "addons",
      "win_delay_load_hook": "true",
      "sources": [
        "addon/src/addon.cc",
        "addon/src/utils/utils.cc",
        "addon/src/signal_timer/signal_timer.cc",
        "addon/src/tcp/tcp.cc",
        "addon/src/tcp/tcp_client.cc",
        "addon/src/signal/signal.cc",
      ],
      "include_dirs" : [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}