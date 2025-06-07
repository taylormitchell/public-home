# Latency Comparison Numbers

## Low-level reads
L1 cache reference                           0.5 ns
L2 cache reference                          10   ns   20x L1 cache
Main memory reference                      100   ns   10x L2 cache, 200x L1 cache
Mutex lock/unlock                           25   ns

## Application-level reads
Read 1 MB sequentially from memory          0.2  ms
Read 1 MB sequentially from SSD*            1    ms   ~1GB/sec SSD, 4X memory, dominated by sequential read time
Read 1 MB sequentially from disk           20    ms   80x memory, 20X SSD
Read 4K randomly from SSD*                  0.1  ms   ~1GB/sec SSD, 4K is typical page size, dominated by overhead
Disk seek time                             10    ms   adds overhead to disk reads

## Small transfers (latency-bound)
Compress 1K bytes with Zippy                   3 us   
Send 1K bytes over 1 Gbps network             10 us   Dominated by protocol overhead
Round trip within same datacenter            0.5 ms    
Send packet CA->Netherlands->CA              150 ms   Represents typical worst-case for global applications

# Notes

This is a modified version of [Latency Comparison Numbers](https://gist.github.com/jboner/2841832) which was created by Jeff Dean based on an [original version](http://norvig.com/21-days.html#answers) by Peter Norvig.

Summary of changes:
- Grouped in a way that makes sense to me. This helps create associations between adjacent numbers. 
- Tried to use a consistent unit within each group. I only want to remember one number for each item, and a consistent scale within a group makes them easier to compare. 
- Fudged some of the numbers to make them easier to remember. Knowing the rough order of magnitude is good enough.
- Added comments to explain the numbers (e.g. many numbers don't make sense unless you know they're considering overhead)
- Removed some numbers which didn't feel relevant to me.

Units:
1 ns = 10^-9 seconds
1 us = 10^-6 seconds = 1,000 ns
1 ms = 10^-3 seconds = 1,000 us = 1,000,000 ns
