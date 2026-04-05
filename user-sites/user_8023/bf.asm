# Brainfuck interpreter in x86_64 assembly - Lev Osin, December 2025
.section .bss
.align 8
tape: .space 30000
.align 8
code_buf: .space 10000

.section .data
hello_code: .asciz "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."

.section .text
.global _start

_start:
    pop %r8                 # argc
    pop %rdi                # argv[0]
    
    mov $tape, %rbx         # tape pointer = &tape[0]
    
    cmp $2, %r8
    jl _use_default
    
    # Use file from argv[1]
    pop %rdi                # argv[1] = filename
    mov $2, %rax            # sys_open
    xor %rsi, %rsi          # O_RDONLY = 0
    syscall
    
    cmp $0, %rax
    jl _use_default         # open failed, use default
    
    mov %rax, %r12          # fd
    mov $code_buf, %r13     # dest pointer
_read_file:
    xor %rax, %rax          # sys_read = 0
    mov %r12, %rdi          # fd
    mov %r13, %rsi          # buf
    mov $1, %rdx            # count
    syscall
    
    cmp $0, %rax
    jle _read_done          # 0 = EOF, negative = error
    inc %r13                # advance dest pointer
    jmp _read_file
_read_done:
    mov %r13, %rdi          # position after last byte read
    xor %al, %al            # null terminator
    movb %al, (%rdi)
    
    mov $3, %rax            # sys_close
    mov %r12, %rdi          # fd
    syscall
    jmp _execute

_use_default:
    # Copy hello_code to code_buf
    mov $hello_code, %rsi
    mov $code_buf, %rdi
    xor %rcx, %rcx          # count
_copy:
    movb (%rsi), %al
    movb %al, (%rdi)
    inc %rsi
    inc %rdi
    test %al, %al
    jnz _copy

_execute:
    mov $code_buf, %rcx     # instruction pointer
_loop:
    movb (%rcx), %al
    test %al, %al
    jz _exit
    
    cmp $'>', %al
    je _right
    cmp $'<', %al
    je _left
    cmp $'+', %al
    je _inc
    cmp $'-', %al
    je _dec
    cmp $'.', %al
    je _out
    cmp $',', %al
    je _in
    cmp $'[', %al
    je _lbracket
    cmp $']', %al
    je _rbracket
    
_next:
    inc %rcx
    jmp _loop

_right:
    inc %rbx
    jmp _next
_left:
    dec %rbx
    jmp _next
_inc:
    incb (%rbx)
    jmp _next
_dec:
    decb (%rbx)
    jmp _next

_out:
    mov $1, %rax            # sys_write
    mov $1, %rdi            # stdout
    mov %rbx, %rsi          # buf = pointer to tape cell
    mov $1, %rdx            # count = 1 byte
    syscall
    jmp _next

_in:
    xor %rax, %rax          # sys_read = 0
    xor %rdi, %rdi          # stdin = 0
    mov %rbx, %rsi          # buf = tape cell address
    mov $1, %rdx            # count = 1
    syscall
    jmp _next

# Jump forward to matching ] if current cell is 0
_lbracket:
    cmpb $0, (%rbx)
    jne _next
    mov $1, %r9             # depth = 1
_lskip:
    inc %rcx                # next instruction
    movb (%rcx), %al
    cmp $'[', %al
    je _lskip_inc
    cmp $']', %al
    je _lskip_dec
    test %al, %al
    jz _exit                # unbalanced brackets - exit
    jmp _lskip
_lskip_inc:
    inc %r9
    jmp _lskip
_lskip_dec:
    dec %r9
    jnz _lskip
    jmp _next

# Jump back to matching [ if current cell is non-zero
_rbracket:
    cmpb $0, (%rbx)
    je _next
    mov $1, %r9             # depth = 1
_rskip:
    dec %rcx                # previous instruction
    movb (%rcx), %al
    cmp $']', %al
    je _rskip_inc
    cmp $'[', %al
    je _rskip_dec
    test %al, %al
    jz _exit                # unbalanced brackets - exit
    jmp _rskip
_rskip_inc:
    inc %r9
    jmp _rskip
_rskip_dec:
    dec %r9
    jnz _rskip
    jmp _next

_exit:
    mov $60, %rax           # sys_exit
    xor %rdi, %rdi          # status = 0
    syscall
