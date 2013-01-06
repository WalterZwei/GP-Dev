drPodder
drnull - support@drpodder.com

USAGE:
  - Add your feeds
  - Download episodes you're interested in
  - Play Podcasts!

UI Description:
  - Feed List Screen:
    - + button to add a feed
    - Refresh button to refresh the list of feeds
    - Feed icon should show up on first update, if the feed has one
    - Line under feed name is the latest episode name
    - 3 mini icons
      - disk - number of episodes downloaded/saved
      - star - number of new episodes (their status is set to Unlistened)
      - pause - number of new episodes you've started listening to (count currently not updating, but bookmarks are retained)
    - Tap the mini icon area for feed operations: (Mark Listened & Edit Feed)
    - Swipe to delete
    - Reorder is supported
  - Episode List Screen:
    - Grayed out episodes are listened
    - Button on right:
      - Blank - listened to, and no file is available
      - Green Down Arrow - Unlistened (new) episode, ready for download
      - Red X - Cancel current download
      - Blue Play - Episode ready to be played
      - Red Minus - Episode has been listened to, file still exists
    - Tap the button on the right for relevent menu choices
      - Download, Stream, Resume, Restart, Mark [Un]Listened, Episode Details, Delete
      - Restart is the only method for going into an episode and starting from the beginning.  All other methods will resume playback from your last saved position

  - Episode Details Screen:
    - Episode Title
    - Playback scrubber with current time and time remaining
      - also has a buffer indicator
    - Episode Description (scrollable)
    - Play/Pause/Download
    - +/-30 seconds button
    - All playback operations *should* save your current position

KNOWN BUGS:
  - Many bugs with streaming (resuming, recovering from errors [i.e., losing signal], etc.  USE ONLY WITH THE UNDERSTANDING THAT IT MAY NOT WORK PROPERLY)
  - Rearranging feeds while a refresh operation is in progress will occasionally drop one of your feeds from the UI.  It should still be there, just exit the app and come back in.
  - Throwing the card away during playback will not save your playback position
  - Sometimes the player icons get out of sync.  They should still function, though (if you're playing and the icon is "play", just tap it once to let the player know it is playing, then pause will work)
  - Others too, feel free to submit bugs or suggestions

TODO:
  - improved streaming support, it's flaky currently
  - evaluate performance - I have no idea how much all this polling and such is affecting battery life.
    - Polling while downloading (no big deal, you're streaming data, it's gonna suck battery)
    - Polling while playing (once a second, we get the position and update stuff. Still need to disable this when the application isn't active)
    - That should be all of the polling locations
  - auto update/auto download/auto delete (schedule based, and configurable)
  - bookmark position indicator
  - ui improvements in general
  - per-feed abbreviations that will get shortened in episode names ("Buzz Out Loud 1025: Amazon's New Kicks" could be shortened to "BOL1025: Amazon's New Kicks")

License:
  - drPodder by Jamie Hatfield is licensed under GPL http://www.gnu.org/licenses/gpl.txt

Credits
  Thanks to Palm for making all of their applications use the same interfaces we use, so we could easily Use The Source to get API pointers!
  Thanks to the PreNews application from the Rough Cuts book for tons of usable source ideas!
  Thanks to Templarian for the simply awesome Komodo Toolbox, you got me away from Eclipse, impressive!
  Thanks to nlowhor for the testing!
  Icons:
    http://www.acomment.net/developer-icon-sets-collection-of-the-best-free-to-both-personal-commercial-use-icon-sets/152
    http://www.userinterfaceicons.com/
    http://www.famfamfam.com/lab/icons/silk/
    http://www.damieng.com/icons/silkcompanion
