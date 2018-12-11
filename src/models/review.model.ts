import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne } from 'typeorm';
import { PackageVersion } from './packageVersion.model';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() grade: 'A' | 'B' | 'C' | 'D' | 'F' | '?';
    @Column() comments: string;
    @Column() updatedAt: Date;
    @OneToOne(type => PackageVersion) packageVersion: PackageVersion;
}